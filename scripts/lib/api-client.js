const { getApiBaseUrl } = require('./env');
const { joinUrl, requestJson } = require('./http');

/**
 * Create an API client that uses the standardized response envelope.
 */
const createApiClient = ({
  baseUrl = getApiBaseUrl(),
  headers = {},
  envelope = true,
  unwrap = false,
} = {}) => {
  const request = async (method, endpoint, options = {}) =>
    requestJson({
      method,
      url: joinUrl(baseUrl, endpoint),
      headers: { ...headers, ...(options.headers || {}) },
      body: options.body,
      timeoutMs: options.timeoutMs,
      envelope,
      unwrap,
    });

  return {
    request,
    get: (endpoint, options) => request('GET', endpoint, options),
    post: (endpoint, body, options) =>
      request('POST', endpoint, { ...options, body }),
    patch: (endpoint, body, options) =>
      request('PATCH', endpoint, { ...options, body }),
    delete: (endpoint, options) => request('DELETE', endpoint, options),
  };
};

module.exports = {
  createApiClient,
};
