const { createApiClient } = require('../lib/api-client');
const { getApiBaseUrl, getFrontendBaseUrl } = require('../lib/env');
const { logError } = require('../lib/errors');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function populateData() {
  const apiBaseUrl = getApiBaseUrl();
  const frontendBaseUrl = getFrontendBaseUrl();
  const api = createApiClient({ baseUrl: apiBaseUrl });

  console.log('Populating calendar with sample data...\n');

  const events = [
    {
      title: 'Morning Workout',
      description: 'Daily exercise routine',
      startDate: '2025-09-17',
      startTime: '07:00',
      endDate: '2025-09-17',
      endTime: '08:00',
      isAllDay: false,
      location: 'Local Gym',
      color: '#3b82f6',
    },
    {
      title: 'Team Meeting',
      description: 'Weekly team synchronization',
      startDate: '2025-09-17',
      startTime: '09:00',
      endDate: '2025-09-17',
      endTime: '10:00',
      isAllDay: false,
      location: 'Conference Room A',
      color: '#ef4444',
    },
    {
      title: 'Lunch Break',
      description: 'Time to eat and relax',
      startDate: '2025-09-17',
      startTime: '12:00',
      endDate: '2025-09-17',
      endTime: '13:00',
      isAllDay: false,
      location: 'Office Cafeteria',
      color: '#10b981',
    },
    {
      title: 'Client Presentation',
      description: 'Important client meeting',
      startDate: '2025-09-18',
      startTime: '14:00',
      endDate: '2025-09-18',
      endTime: '15:30',
      isAllDay: false,
      location: 'Meeting Room B',
      color: '#f59e0b',
    },
    {
      title: 'Project Deadline',
      description: 'Final submission due',
      startDate: '2025-09-19',
      isAllDay: true,
      color: '#ef4444',
    },
    {
      title: 'Company Holiday',
      description: 'Office closed for holiday',
      startDate: '2025-09-22',
      isAllDay: true,
      color: '#8b5cf6',
    },
    {
      title: 'Weekend Planning',
      description: 'Plan activities for the weekend',
      startDate: '2025-09-20',
      startTime: '18:00',
      endDate: '2025-09-20',
      endTime: '19:00',
      isAllDay: false,
      location: 'Home',
      color: '#06b6d4',
    },
    {
      title: 'Code Review Session',
      description: 'Review recent code changes',
      startDate: '2025-09-23',
      startTime: '10:30',
      endDate: '2025-09-23',
      endTime: '11:30',
      isAllDay: false,
      location: 'Dev Room',
      color: '#84cc16',
    },
  ];

  console.log(`Creating ${events.length} sample events...\n`);

  let successCount = 0;
  for (let i = 0; i < events.length; i += 1) {
    const event = events[i];
    console.log(`${i + 1}. Creating: "${event.title}"`);

    try {
      const response = await api.post('/events', event);
      const payload = response?.data ?? response;
      if (!payload) {
        throw new Error('Empty response payload');
      }
      console.log(`  OK: ${event.title}`);
      successCount += 1;
    } catch (error) {
      logError(`create event "${event.title}"`, error);
    }

    await sleep(100);
  }

  console.log('\nResults:');
  console.log(`OK: ${successCount} events`);
  console.log(`Failed: ${events.length - successCount} events`);

  console.log('\nFetching all events:');
  const allEventsResponse = await api.get('/events');
  const allEvents = allEventsResponse?.data ?? allEventsResponse;

  if (Array.isArray(allEvents) && allEvents.length > 0) {
    console.log(`\nFound ${allEvents.length} events in the calendar:`);
    allEvents.forEach((event) => {
      console.log(`  - ${event.title} (${event.startDate})`);
    });
  } else {
    console.log('\nNo events found (this might be expected for testing)');
  }

  console.log('\nData population completed.');
  console.log('\nTest your calendar at:');
  console.log(`  Frontend: ${frontendBaseUrl}`);
  console.log(`  API: ${apiBaseUrl}/events`);
  console.log(`  Docs: ${apiBaseUrl}/docs`);
}

populateData().catch((error) => {
  logError('populate-data', error);
  process.exitCode = 1;
});
