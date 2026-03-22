export const IDLE_PROMPT_KEY_PREFIX = 'idle_prompt_';
export const DEFAULT_IDLE_PROMPT_FALLBACK = 'No event right now.';
export const DEFAULT_IDLE_MEETING_FALLBACK =
  'No active meeting. Use this block for focused work.';

const NUMBERING_PREFIX_REGEX = /^\s*\d+\s*[\)\].:-]?\s*/;

export interface DeterministicDailyPromptInput {
  seed: string;
  dateKey: string;
  promptCount: number;
}

const fnv1a32 = (value: string): number => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

export const sanitizeIdlePromptLine = (line: string): string =>
  line.replace(NUMBERING_PREFIX_REGEX, '').trim();

export const parseIdlePromptLines = (rawText: string): string[] => {
  if (!rawText) {
    return [];
  }
  return rawText
    .split(/\r?\n/)
    .map(sanitizeIdlePromptLine)
    .filter((line) => line.length > 0);
};

export const getIdlePromptKey = (index: number): string =>
  `${IDLE_PROMPT_KEY_PREFIX}${Math.max(0, Math.floor(index))
    .toString()
    .padStart(4, '0')}`;

export const selectDeterministicDailyPromptIndex = ({
  seed,
  dateKey,
  promptCount,
}: DeterministicDailyPromptInput): number => {
  if (!Number.isFinite(promptCount) || promptCount <= 0) {
    return 0;
  }
  const normalizedPromptCount = Math.max(1, Math.floor(promptCount));
  const hash = fnv1a32(`${seed}::${dateKey}`);
  return hash % normalizedPromptCount;
};

export const getDateKeyInTimeZone = (date: Date, timeZone?: string): string => {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(date);
    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = parts.find((part) => part.type === 'day')?.value;
    if (year && month && day) {
      return `${year}-${month}-${day}`;
    }
  } catch {
    // Fall through to local date handling.
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
