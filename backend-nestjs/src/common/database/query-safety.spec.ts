import {
  escapeSqlLikePattern,
  toContainsLikePattern,
} from './query-safety';

describe('query-safety helpers', () => {
  it.each([
    'abc',
    'a%b',
    'a_b',
    'a\\b',
    '%',
    '_',
    '\\',
    "' OR 1=1 --",
    "'; DROP TABLE users; --",
    'admin%_\\',
    '100% guaranteed',
    '___',
    '\\\\\\',
    'multi%segment_value',
    'SELECT * FROM users',
    'name LIKE %test%',
    'x_y_z',
    'search\\term',
    'foo%bar_baz\\qux',
    '"; DELETE FROM x; --',
    '/* comment */',
    'null-byte-\u0000',
    'spaces and % percent',
    'C:\\temp\\path',
    '☃%_emoji',
    'row_01',
    'wild%%%%',
    '__leading',
    'trailing__',
    'mix_%_\\_%',
  ])('escapes LIKE-special characters in payload: %s', (payload) => {
    const escaped = escapeSqlLikePattern(payload);

    expect(escaped).not.toMatch(/(?<!\\)%/);
    expect(escaped).not.toMatch(/(?<!\\)_/);
  });

  it('wraps escaped payload in contains pattern', () => {
    expect(toContainsLikePattern('a%b_c\\d')).toBe('%a\\%b\\_c\\\\d%');
  });
});
