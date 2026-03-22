import rawIdlePromptText from '../../../idle_prompts.txt?raw';
import { buildOfflineTimelineUserKey } from '../services/offlineTimelineCache';
import type { OfflineCacheUserIdentity } from '../services/offlineTimelineCache';
import {
  DEFAULT_IDLE_PROMPT_FALLBACK,
  getDateKeyInTimeZone,
  getIdlePromptKey,
  parseIdlePromptLines,
  selectDeterministicDailyPromptIndex,
} from './liveFocusIdlePromptSelector';

const LIVE_FOCUS_DEVICE_SEED_STORAGE_KEY = 'primecal.live_focus.device_seed';
const DEFAULT_DEVICE_SEED = 'device:unknown';

type IdlePromptCatalogState = {
  lines: string[];
  hasError: boolean;
};

let cachedCatalogState: IdlePromptCatalogState | null = null;

const buildCatalogState = (): IdlePromptCatalogState => {
  try {
    const lines = parseIdlePromptLines(rawIdlePromptText);
    if (lines.length === 0) {
      return { lines: [], hasError: true };
    }
    return { lines, hasError: false };
  } catch {
    return { lines: [], hasError: true };
  }
};

const randomSeedSegment = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(16).slice(2);
};

export const getOrCreateLiveFocusDeviceSeed = (): string => {
  if (typeof localStorage === 'undefined') {
    return DEFAULT_DEVICE_SEED;
  }

  try {
    const existing = localStorage.getItem(LIVE_FOCUS_DEVICE_SEED_STORAGE_KEY);
    if (existing && existing.trim().length > 0) {
      return existing;
    }
    const generated = `device:${randomSeedSegment()}`;
    localStorage.setItem(LIVE_FOCUS_DEVICE_SEED_STORAGE_KEY, generated);
    return generated;
  } catch {
    return DEFAULT_DEVICE_SEED;
  }
};

export const getIdlePromptCatalogState = (): IdlePromptCatalogState => {
  if (!cachedCatalogState) {
    cachedCatalogState = buildCatalogState();
  }
  return cachedCatalogState;
};

export const buildLiveFocusDailySeed = (
  user: OfflineCacheUserIdentity | null | undefined,
): string => {
  const userKey = buildOfflineTimelineUserKey(user) ?? 'user:anonymous';
  const deviceSeed = getOrCreateLiveFocusDeviceSeed();
  return `${userKey}|${deviceSeed}`;
};

export interface DailyIdlePromptSelection {
  index: number | null;
  key: string | null;
  text: string;
  hasError: boolean;
}

interface DailyIdlePromptSelectionInput {
  date: Date;
  timeZone?: string;
  user: OfflineCacheUserIdentity | null | undefined;
  translate: (key: string, fallbackValue: string) => string;
}

export const getDailyIdlePromptSelection = ({
  date,
  timeZone,
  user,
  translate,
}: DailyIdlePromptSelectionInput): DailyIdlePromptSelection => {
  const catalog = getIdlePromptCatalogState();
  if (catalog.lines.length === 0) {
    return {
      index: null,
      key: null,
      text: DEFAULT_IDLE_PROMPT_FALLBACK,
      hasError: true,
    };
  }

  const seed = buildLiveFocusDailySeed(user);
  const dateKey = getDateKeyInTimeZone(date, timeZone);
  const index = selectDeterministicDailyPromptIndex({
    seed,
    dateKey,
    promptCount: catalog.lines.length,
  });
  const key = getIdlePromptKey(index);
  const englishFallback = catalog.lines[index] ?? DEFAULT_IDLE_PROMPT_FALLBACK;
  const text = translate(key, englishFallback);

  return {
    index,
    key,
    text: text || englishFallback,
    hasError: catalog.hasError,
  };
};
