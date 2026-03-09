const LIKE_SPECIAL_CHARS = /[\\%_]/g;

/**
 * Escape SQL LIKE wildcard characters so user input is treated as plain text.
 */
export function escapeSqlLikePattern(value: string): string {
  return value.replace(LIKE_SPECIAL_CHARS, '\\$&');
}

/**
 * Wrap a value for case-insensitive contains search while preserving escaping.
 */
export function toContainsLikePattern(value: string): string {
  return `%${escapeSqlLikePattern(value)}%`;
}

