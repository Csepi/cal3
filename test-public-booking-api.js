const fetch = require('node-fetch');

async function testPublicBooking() {
  try {
    // Step 1: Login to get auth token
    console.log('🔐 Logging in...');
    const loginResponse = await fetch('http://localhost:8081/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'alice', password: 'password123' })
    });

    if (!loginResponse.ok) {
      console.error('❌ Login failed:', await loginResponse.text());
      return;
    }

    const { access_token } = await loginResponse.json();
    console.log('✅ Logged in successfully');

    // Step 2: Get existing resources
    console.log('\n📋 Fetching resources...');
    const resourcesResponse = await fetch('http://localhost:8081/api/resources', {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });

    if (!resourcesResponse.ok) {
      console.error('❌ Failed to fetch resources:', await resourcesResponse.text());
      return;
    }

    const resources = await resourcesResponse.json();
    console.log(`✅ Found ${resources.length} resources`);

    if (resources.length === 0) {
      console.log('⚠️  No resources found. Please create a resource first.');
      return;
    }

    const resource = resources[0];
    console.log(`\n🎯 Testing with resource: ${resource.name} (ID: ${resource.id})`);

    if (!resource.publicBookingToken) {
      console.log('⚠️  Resource does not have a publicBookingToken yet');
      console.log('   This is expected for existing resources. The token will be generated on first update.');
      return;
    }

    const token = resource.publicBookingToken;
    console.log(`📝 Public booking token: ${token.substring(0, 20)}...`);

    // Step 3: Test public booking endpoint (no auth required)
    console.log(`\n🧪 Testing GET /api/public/booking/${token}`);
    const publicResponse = await fetch(`http://localhost:8081/api/public/booking/${token}`);

    if (!publicResponse.ok) {
      const error = await publicResponse.text();
      console.error('❌ Public booking endpoint failed:', error);
      return;
    }

    const publicData = await publicResponse.json();
    console.log('✅ Public booking endpoint works!');
    console.log('   Resource:', publicData.name);
    console.log('   Type:', publicData.resourceType?.name);
    console.log('   Description:', publicData.description || 'N/A');

    // Step 4: Test availability endpoint
    const today = new Date().toISOString().split('T')[0];
    console.log(`\n🧪 Testing GET /api/public/booking/${token}/availability?date=${today}`);
    const availResponse = await fetch(`http://localhost:8081/api/public/booking/${token}/availability?date=${today}`);

    if (!availResponse.ok) {
      const error = await availResponse.text();
      console.error('❌ Availability endpoint failed:', error);
      return;
    }

    const availData = await availResponse.json();
    console.log('✅ Availability endpoint works!');
    console.log('   Date:', availData.date);
    console.log('   Available slots:', availData.availableSlots?.length || 0);

    if (availData.availableSlots && availData.availableSlots.length > 0) {
      console.log('   First slot:', availData.availableSlots[0].start, '-', availData.availableSlots[0].end);
    }

    console.log('\n🎉 All tests passed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPublicBooking();