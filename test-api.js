const API_BASE = 'http://localhost:8081/api';

async function makeRequest(method, endpoint, data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const result = await response.json();
    console.log(`${method} ${endpoint} -> ${response.status}:`, JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error(`${method} ${endpoint} failed:`, error.message);
    return null;
  }
}

async function testAPI() {
  console.log('🔍 Testing Calendar API...\n');

  // Test basic endpoints
  console.log('1. Testing GET /events (should work without auth)');
  await makeRequest('GET', '/events');

  console.log('\n2. Testing GET / (health check)');
  await makeRequest('GET', '/');

  // Create a simple event using the public endpoint
  console.log('\n3. Testing POST /events (public - no calendarId)');
  const testEvent = {
    title: 'Test Event via API',
    description: 'Testing API functionality',
    startDate: '2025-09-17',
    startTime: '14:00',
    endDate: '2025-09-17',
    endTime: '15:00',
    isAllDay: false,
    location: 'Test Location'
  };

  const createdEvent = await makeRequest('POST', '/events', testEvent);

  // If the event was created, test retrieving it
  if (createdEvent && createdEvent.id) {
    console.log('\n4. Testing GET /events again (should show the new event)');
    await makeRequest('GET', '/events');
  }

  console.log('\n✅ API testing completed!');
}

// Run the test
testAPI().catch(console.error);