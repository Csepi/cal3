import {
  getDateKeyInTimeZone,
  getIdlePromptKey,
  parseIdlePromptLines,
  sanitizeIdlePromptLine,
  selectDeterministicDailyPromptIndex,
} from '../utils/liveFocusIdlePromptSelector';

describe('liveFocusIdlePromptSelector', () => {
  test('returns the same index for the same seed and date', () => {
    const seed = 'id:7|device:abc123';
    const dateKey = '2026-03-22';

    const first = selectDeterministicDailyPromptIndex({
      seed,
      dateKey,
      promptCount: 1000,
    });
    const second = selectDeterministicDailyPromptIndex({
      seed,
      dateKey,
      promptCount: 1000,
    });

    expect(first).toBe(second);
  });

  test('different dates usually map to different indices', () => {
    const seed = 'id:7|device:abc123';
    const dateKeys = [
      '2026-03-22',
      '2026-03-23',
      '2026-03-24',
      '2026-03-25',
      '2026-03-26',
      '2026-03-27',
      '2026-03-28',
    ];

    const indices = dateKeys.map((dateKey) =>
      selectDeterministicDailyPromptIndex({
        seed,
        dateKey,
        promptCount: 1000,
      }),
    );

    expect(new Set(indices).size).toBeGreaterThanOrEqual(5);
  });

  test('indices are always inside 0..999 for 1000 prompts', () => {
    const seed = 'id:77|device:phone';

    for (let day = 1; day <= 31; day += 1) {
      const index = selectDeterministicDailyPromptIndex({
        seed,
        dateKey: `2026-04-${String(day).padStart(2, '0')}`,
        promptCount: 1000,
      });
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThanOrEqual(999);
      expect(getIdlePromptKey(index)).toMatch(/^idle_prompt_\d{4}$/);
    }
  });

  test('shorter prompt catalogs stay safe and in range', () => {
    const index = selectDeterministicDailyPromptIndex({
      seed: 'id:19|device:laptop',
      dateKey: '2026-03-22',
      promptCount: 7,
    });

    expect(index).toBeGreaterThanOrEqual(0);
    expect(index).toBeLessThan(7);
  });

  test('numbered lines are sanitized while parsing', () => {
    const raw = [
      '1. Nothing scheduled right now: perfect time for a deep breath.',
      '002) No active meeting, only active caffeine.',
      '  003 - Your calendar called in quiet mode.',
      '',
      'Normal sentence without numbering.',
    ].join('\n');

    const lines = parseIdlePromptLines(raw);

    expect(lines).toEqual([
      'Nothing scheduled right now: perfect time for a deep breath.',
      'No active meeting, only active caffeine.',
      'Your calendar called in quiet mode.',
      'Normal sentence without numbering.',
    ]);
    expect(sanitizeIdlePromptLine('004: Test line')).toBe('Test line');
  });

  test('date key formatting is stable for a timezone', () => {
    const date = new Date('2026-03-22T22:15:00.000Z');
    const key = getDateKeyInTimeZone(date, 'Europe/Budapest');
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
