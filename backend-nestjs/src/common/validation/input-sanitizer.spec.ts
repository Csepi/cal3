import { sanitizeInput, sanitizeTextInput } from './input-sanitizer';

describe('input-sanitizer', () => {
  it('removes ASCII control characters and bidi control characters', () => {
    const dirty = 'hello\u0000\u0007\u202Eworld';
    expect(sanitizeTextInput(dirty)).toBe('helloworld');
  });

  it('normalizes Unicode text using NFKC', () => {
    expect(sanitizeTextInput('ＡＢＣ１２３')).toBe('ABC123');
  });

  it('sanitizes nested objects and arrays', () => {
    const payload = {
      body: '\u0000hello',
      nested: {
        comment: 'value\u202E',
        tags: ['ok', 'bad\u0007'],
      },
    };

    const result = sanitizeInput(payload);
    expect(result).toEqual({
      body: 'hello',
      nested: {
        comment: 'value',
        tags: ['ok', 'bad'],
      },
    });
  });

  it('preserves Date instances', () => {
    const date = new Date('2026-01-01T00:00:00.000Z');
    const result = sanitizeInput({ date });
    expect(result.date).toBe(date);
  });

  it('respects maxDepth and stops sanitizing deeper values', () => {
    const payload = {
      level1: {
        level2: {
          text: 'a\u0000b',
        },
      },
    };

    const shallow = sanitizeInput(payload, { maxDepth: 1 });
    expect(shallow.level1.level2.text).toBe('a\u0000b');

    const deep = sanitizeInput(payload, { maxDepth: 4 });
    expect(deep.level1.level2.text).toBe('ab');
  });
});
