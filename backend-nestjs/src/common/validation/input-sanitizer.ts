const ASCII_CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const BIDI_CONTROL_CHARS = /[\u202A-\u202E\u2066-\u2069]/g;

export interface InputSanitizerOptions {
  maxDepth?: number;
}

/**
 * Normalize inbound text to remove dangerous control characters while
 * preserving printable content.
 */
export function sanitizeTextInput(value: string): string {
  return value
    .normalize('NFKC')
    .replace(ASCII_CONTROL_CHARS, '')
    .replace(BIDI_CONTROL_CHARS, '');
}

/**
 * Recursively sanitize user-controlled input payloads.
 */
export function sanitizeInput<T>(
  value: T,
  options: InputSanitizerOptions = {},
): T {
  const maxDepth = options.maxDepth ?? 8;
  return sanitizeAtDepth(value, maxDepth) as T;
}

function sanitizeAtDepth(value: unknown, depthLeft: number): unknown {
  if (depthLeft < 0) {
    return value;
  }

  if (typeof value === 'string') {
    return sanitizeTextInput(value);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeAtDepth(entry, depthLeft - 1));
  }

  if (value instanceof Date) {
    return value;
  }

  const input = value as Record<string, unknown>;
  const output: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(input)) {
    output[key] = sanitizeAtDepth(entry, depthLeft - 1);
  }
  return output;
}

