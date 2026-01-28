const { createApiClient } = require('../lib/api-client');
const { login } = require('../lib/auth');
const { getApiBaseUrl } = require('../lib/env');
const { logError } = require('../lib/errors');

async function testPublicBooking() {
  const apiBaseUrl = getApiBaseUrl();

  try {
    console.log('Logging in...');
    const accessToken = await login({ baseUrl: apiBaseUrl });
    console.log('OK: Logged in successfully');

    const api = createApiClient({
      baseUrl: apiBaseUrl,
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log('\nFetching resources...');
    const resourcesResponse = await api.get('/resources');
    const resources = resourcesResponse?.data ?? resourcesResponse;
    console.log(`OK: Found ${resources.length} resources`);

    if (resources.length === 0) {
      console.log('WARN: No resources found. Create a resource first.');
      return;
    }

    const resource = resources[0];
    console.log(`\nTesting with resource: ${resource.name} (ID: ${resource.id})`);

    if (!resource.publicBookingToken) {
      console.log('WARN: Resource does not have a publicBookingToken yet');
      console.log('This is expected for existing resources. Token is generated on update.');
      return;
    }

    const token = resource.publicBookingToken;
    console.log(`Public booking token: ${token.substring(0, 20)}...`);

    console.log(`\nTesting GET /public/booking/${token}`);
    const publicResponse = await createApiClient({ baseUrl: apiBaseUrl }).get(
      `/public/booking/${token}`,
    );
    const publicData = publicResponse?.data ?? publicResponse;

    console.log('OK: Public booking endpoint works');
    console.log(`   Resource: ${publicData.name}`);
    console.log(`   Type: ${publicData.resourceType?.name}`);
    console.log(`   Description: ${publicData.description || 'N/A'}`);

    const today = new Date().toISOString().split('T')[0];
    console.log(`\nTesting GET /public/booking/${token}/availability?date=${today}`);
    const availResponse = await createApiClient({ baseUrl: apiBaseUrl }).get(
      `/public/booking/${token}/availability?date=${today}`,
    );
    const availData = availResponse?.data ?? availResponse;

    console.log('OK: Availability endpoint works');
    console.log(`   Date: ${availData.date}`);
    console.log(`   Available slots: ${availData.availableSlots?.length || 0}`);

    if (availData.availableSlots && availData.availableSlots.length > 0) {
      console.log(
        `   First slot: ${availData.availableSlots[0].start} - ${availData.availableSlots[0].end}`,
      );
    }

    console.log('\nAll tests passed.');
  } catch (error) {
    logError('test-public-booking-api', error);
    process.exitCode = 1;
  }
}

testPublicBooking();
