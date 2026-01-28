const { Client } = require('pg');
const { getDbConfig } = require('./env');

/**
 * Create a PostgreSQL client using the shared database config mapping.
 */
const createDbClient = (overrides = {}) => {
  const config = getDbConfig(overrides);
  return new Client(config);
};

/**
 * Run a callback with an opened PostgreSQL client.
 */
const withDbClient = async (callback, overrides = {}) => {
  const client = createDbClient(overrides);
  await client.connect();
  try {
    return await callback(client);
  } finally {
    await client.end();
  }
};

module.exports = {
  createDbClient,
  withDbClient,
};
