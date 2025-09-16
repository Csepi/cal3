// Simple script to populate calendar data via API calls
const API_BASE = 'http://localhost:8081/api';

async function apiCall(method, endpoint, data = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };

  if (data) options.body = JSON.stringify(data);

  const response = await fetch(`${API_BASE}${endpoint}`, options);
  const result = await response.json();

  if (!response.ok) {
    console.log(`❌ ${method} ${endpoint} failed:`, result.message || result);
    return null;
  }

  console.log(`✅ ${method} ${endpoint} success`);
  return result;
}

async function populateData() {
  console.log('🌱 Populating calendar with sample data...\n');

  // Sample events with different patterns
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
      color: '#3b82f6'
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
      color: '#ef4444'
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
      color: '#10b981'
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
      color: '#f59e0b'
    },
    {
      title: 'Project Deadline',
      description: 'Final submission due',
      startDate: '2025-09-19',
      isAllDay: true,
      color: '#ef4444'
    },
    {
      title: 'Company Holiday',
      description: 'Office closed for holiday',
      startDate: '2025-09-22',
      isAllDay: true,
      color: '#8b5cf6'
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
      color: '#06b6d4'
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
      color: '#84cc16'
    }
  ];

  console.log(`📝 Creating ${events.length} sample events...\n`);

  let successCount = 0;
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    console.log(`${i + 1}. Creating: "${event.title}"`);

    const result = await apiCall('POST', '/events', event);
    if (result) {
      successCount++;
    }

    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n📊 Results:`);
  console.log(`✅ Successfully created: ${successCount} events`);
  console.log(`❌ Failed: ${events.length - successCount} events`);

  // Test the GET endpoint to see created events
  console.log('\n🔍 Fetching all events:');
  const allEvents = await apiCall('GET', '/events');

  if (allEvents && allEvents.length > 0) {
    console.log(`\n📅 Found ${allEvents.length} events in the calendar:`);
    allEvents.forEach(event => {
      console.log(`  • ${event.title} (${event.startDate})`);
    });
  } else {
    console.log('\n📭 No events found (this might be expected for testing)');
  }

  console.log('\n🎉 Data population completed!');
  console.log('\n🔗 Test your calendar at:');
  console.log('  Frontend: http://localhost:8080');
  console.log('  API: http://localhost:8081/api/events');
  console.log('  Docs: http://localhost:8081/api/docs');
}

populateData().catch(console.error);