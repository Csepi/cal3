const { formatError, logError } = require('./errors');

const fetchImpl = global.fetch || require('node-fetch');

const DEFAULT_ENVELOPE_HEADER = 'x-response-envelope';

/**
 * Join a base URL and endpoint into a single URL.
 */
const joinUrl = (baseUrl, endpoint) => {
  if (!endpoint) {
    return baseUrl;
  }
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const normalizedBase = baseUrl.endsWith('/')
    ? baseUrl.slice(0, -1)
    : baseUrl;
  const normalizedEndpoint = endpoint.startsWith('/')
    ? endpoint.slice(1)
    : endpoint;
  return `${normalizedBase}/${normalizedEndpoint}`;
};

/**
 * Safely parse JSON text into an object.
 */
const safeParseJson = (text) => {
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

/**
 * Check if a payload already uses the API response envelope.
 */
const isApiResponse = (payload) => {
  return Boolean(payload && typeof payload === 'object' && 'success' in payload);
};

/**
 * Normalize API error payloads into a consistent error object.
 */
const normalizeErrorPayload = (payload, status, statusText, requestId) => {
  if (payload && typeof payload === 'object') {
    if (payload.error && payload.success === false) {
      return {
        message: payload.error.message || statusText || 'Request failed',
        code: payload.error.code,
        details: payload.error.details,
        requestId: payload.error.requestId || requestId,
      };
    }
    if (payload.code && payload.message) {
      return {
        message: payload.message,
        code: payload.code,
        details: payload.details,
        requestId,
      };
    }
  }

  return {
    message: statusText || 'Request failed',
    code: 'UNKNOWN',
    details: payload,
    requestId,
  };
};

/**
 * Execute an HTTP request and return a standardized response envelope.
 */
const requestJson = async ({
  method,
  url,
  headers = {},
  body,
  timeoutMs,
  envelope = true,
  unwrap = false,
} = {}) => {
  const controller = timeoutMs ? new AbortController() : null;
  const timeoutId = timeoutMs
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;

  const resolvedHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (envelope && !Object.prototype.hasOwnProperty.call(resolvedHeaders, DEFAULT_ENVELOPE_HEADER)) {
    resolvedHeaders[DEFAULT_ENVELOPE_HEADER] = '1';
  }

  const options = {
    method,
    headers: resolvedHeaders,
    signal: controller ? controller.signal : undefined,
    body: body === undefined || body === null ? undefined : JSON.stringify(body),
  };

  try {
    const response = await fetchImpl(url, options);
    const text = await response.text();
    const parsed = safeParseJson(text) ?? text;
    const requestId = response.headers.get('x-request-id');

    if (!response.ok) {
      const normalized = normalizeErrorPayload(
        parsed,
        response.status,
        response.statusText,
        requestId,
      );
      const error = new Error(
        normalized.message || `Request failed: ${response.status}`,
      );
      error.status = response.status;
      error.code = normalized.code;
      error.details = normalized.details;
      error.requestId = normalized.requestId;
      error.body = parsed;
      throw error;
    }

    if (!envelope) {
      return parsed;
    }

    const envelopeResponse = isApiResponse(parsed)
      ? parsed
      : {
          success: true,
          data: parsed,
          requestId,
        };

    return unwrap ? envelopeResponse.data : envelopeResponse;
  } catch (error) {
    logError('http.request', error);
    const formatted = formatError(error);
    const wrapped = new Error(formatted.message);
    wrapped.cause = error;
    if (error && typeof error === 'object') {
      if ('status' in error) {
        wrapped.status = error.status;
      }
      if ('code' in error) {
        wrapped.code = error.code;
      }
      if ('details' in error) {
        wrapped.details = error.details;
      }
      if ('requestId' in error) {
        wrapped.requestId = error.requestId;
      }
      if ('body' in error) {
        wrapped.body = error.body;
      }
    }
    throw wrapped;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

module.exports = {
  joinUrl,
  requestJson,
};
