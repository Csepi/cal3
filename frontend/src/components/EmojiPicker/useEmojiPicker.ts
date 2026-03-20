import { useCallback, useEffect, useMemo, useState } from 'react';

import { tStatic } from '../../i18n';
import { EMOJI_CATEGORIES, EMOJI_DEFINITIONS } from './emojiCategories';
import { resolveEmojiLocalizedName } from './emojiNames';
import {
  createCustomEmojiToken,
  loadCustomEmojis,
  persistCustomEmojis,
} from './customEmojis';
import type {
  CustomEmojiDefinition,
  EmojiCategoryId,
  EmojiOption,
  PickerCategoryProp,
  SkinTone,
} from './types';

const RECENT_STORAGE_KEY = 'primecal:emoji-picker:recent';
const SKIN_TONE_STORAGE_KEY = 'primecal:emoji-picker:skin-tone';

const MAX_RECENT = 28;
const MAX_CUSTOM_EMOJIS = 80;
const MAX_CUSTOM_EMOJI_FILE_SIZE = 1024 * 1024;

const parseStringArray = (raw: string | null): string[] => {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((entry): entry is string => typeof entry === 'string');
  } catch {
    return [];
  }
};

const isStorageAvailable = (): boolean =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const CATEGORY_PRESETS: Record<PickerCategoryProp, Array<Exclude<EmojiCategoryId, 'custom'>>> = {
  all: EMOJI_CATEGORIES.map((category) => category.id),
  calendar: ['objects', 'symbols', 'people', 'activities'],
  event: ['smileys', 'people', 'activities', 'symbols', 'food', 'travel'],
  resource: ['objects', 'travel', 'nature', 'symbols'],
};

const toEmojiOption = (
  emoji: (typeof EMOJI_DEFINITIONS)[number],
  skinTone: SkinTone,
  locale: string | undefined,
): EmojiOption => {
  const tonedValue =
    skinTone === 'default' ? undefined : emoji.skinTones?.[skinTone];

  return {
    key: emoji.id,
    value: tonedValue ?? emoji.emoji,
    name: resolveEmojiLocalizedName(emoji.id, locale, emoji.name),
    keywords: emoji.keywords,
    category: emoji.category,
    isCustom: false,
  };
};

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error(tStatic('emojiPicker.errors.processFile')));
    };
    reader.onerror = () => reject(new Error(tStatic('emojiPicker.errors.readFile')));
    reader.readAsDataURL(file);
  });

const normalize = (value: string): string => value.trim().toLowerCase();

const searchScore = (option: EmojiOption, normalizedQuery: string): number => {
  if (!normalizedQuery) {
    return Number.MAX_SAFE_INTEGER;
  }

  const name = option.name.toLowerCase();
  if (name === normalizedQuery) {
    return 0;
  }

  if (name.startsWith(normalizedQuery)) {
    return 1;
  }

  if (name.includes(normalizedQuery)) {
    return 2;
  }

  if (option.keywords.some((keyword) => keyword.toLowerCase().startsWith(normalizedQuery))) {
    return 3;
  }

  return 4;
};

export interface UseEmojiPickerOptions {
  value?: string;
  category?: PickerCategoryProp;
  locale?: string;
  onChange: (value: string | undefined) => void;
}

export interface UploadResult {
  ok: boolean;
  error?: string;
}

export const useEmojiPicker = ({
  value,
  category = 'all',
  locale,
  onChange,
}: UseEmojiPickerOptions) => {
  const allowedCategories = CATEGORY_PRESETS[category];

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<EmojiCategoryId>(allowedCategories[0]);
  const [skinTone, setSkinTone] = useState<SkinTone>('default');
  const [recentKeys, setRecentKeys] = useState<string[]>([]);
  const [customEmojis, setCustomEmojis] = useState<CustomEmojiDefinition[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isStorageAvailable()) {
      return;
    }

    setRecentKeys(parseStringArray(window.localStorage.getItem(RECENT_STORAGE_KEY)));

    const storedSkinTone = window.localStorage.getItem(SKIN_TONE_STORAGE_KEY) as SkinTone | null;
    if (
      storedSkinTone &&
      ['default', 'light', 'medium-light', 'medium', 'medium-dark', 'dark'].includes(storedSkinTone)
    ) {
      setSkinTone(storedSkinTone);
    }

    setCustomEmojis(loadCustomEmojis());
  }, []);

  useEffect(() => {
    if (!isStorageAvailable()) {
      return;
    }

    window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(recentKeys.slice(0, MAX_RECENT)));
  }, [recentKeys]);

  useEffect(() => {
    if (!isStorageAvailable()) {
      return;
    }

    window.localStorage.setItem(SKIN_TONE_STORAGE_KEY, skinTone);
  }, [skinTone]);

  useEffect(() => {
    persistCustomEmojis(customEmojis);
  }, [customEmojis]);

  useEffect(() => {
    if (!allowedCategories.includes(selectedCategory as Exclude<EmojiCategoryId, 'custom'>)) {
      setSelectedCategory(allowedCategories[0]);
    }
  }, [allowedCategories, selectedCategory]);

  const baseEmojiOptions = useMemo(
    () =>
      EMOJI_DEFINITIONS.filter((emoji) => allowedCategories.includes(emoji.category)).map((emoji) =>
        toEmojiOption(emoji, skinTone, locale),
      ),
    [allowedCategories, locale, skinTone],
  );

  const customEmojiOptions = useMemo<EmojiOption[]>(
    () =>
      customEmojis.map((emoji) => ({
        key: emoji.token,
        value: emoji.token,
        name: emoji.name,
        category: 'custom',
        keywords: ['custom', 'upload', emoji.name],
        isCustom: true,
        dataUrl: emoji.dataUrl,
      })),
    [customEmojis],
  );

  const optionIndex = useMemo(() => {
    const map = new Map<string, EmojiOption>();
    [...baseEmojiOptions, ...customEmojiOptions].forEach((emoji) => {
      map.set(emoji.key, emoji);
    });
    return map;
  }, [baseEmojiOptions, customEmojiOptions]);

  const recentlyUsed = useMemo(
    () =>
      recentKeys
        .map((key) => optionIndex.get(key))
        .filter((emoji): emoji is EmojiOption => Boolean(emoji)),
    [optionIndex, recentKeys],
  );

  const normalizedQuery = normalize(query);

  const filteredSearchResults = useMemo(() => {
    if (!normalizedQuery) {
      return [] as EmojiOption[];
    }

    return [...baseEmojiOptions, ...customEmojiOptions]
      .filter((option) => {
        const targetName = option.name.toLowerCase();
        if (targetName.includes(normalizedQuery)) {
          return true;
        }

        return option.keywords.some((keyword) => keyword.toLowerCase().includes(normalizedQuery));
      })
      .sort((left, right) => {
        const scoreDiff = searchScore(left, normalizedQuery) - searchScore(right, normalizedQuery);
        if (scoreDiff !== 0) {
          return scoreDiff;
        }
        return left.name.localeCompare(right.name);
      })
      .slice(0, 150);
  }, [baseEmojiOptions, customEmojiOptions, normalizedQuery]);

  const categoryOptions = useMemo(() => {
    if (selectedCategory === 'custom') {
      return customEmojiOptions;
    }

    return baseEmojiOptions.filter((emoji) => emoji.category === selectedCategory);
  }, [baseEmojiOptions, customEmojiOptions, selectedCategory]);

  const suggestions = useMemo(() => {
    if (!normalizedQuery) {
      return [] as EmojiOption[];
    }

    const deduped = new Set<string>();
    const top: EmojiOption[] = [];

    for (const option of filteredSearchResults) {
      if (deduped.has(option.name)) {
        continue;
      }
      deduped.add(option.name);
      top.push(option);
      if (top.length >= 8) {
        break;
      }
    }

    return top;
  }, [filteredSearchResults, normalizedQuery]);

  const selectedEmojiOption = useMemo(() => {
    if (!value) {
      return undefined;
    }

    if (optionIndex.has(value)) {
      return optionIndex.get(value);
    }

    return baseEmojiOptions.find((option) => option.value === value);
  }, [baseEmojiOptions, optionIndex, value]);

  const activeOptions = normalizedQuery ? filteredSearchResults : categoryOptions;

  const markAsRecent = useCallback((key: string) => {
    setRecentKeys((previous) => {
      const next = [key, ...previous.filter((entry) => entry !== key)];
      return next.slice(0, MAX_RECENT);
    });
  }, []);

  const selectEmoji = useCallback(
    (option: EmojiOption) => {
      onChange(option.value);
      markAsRecent(option.key);
      setIsOpen(false);
      setQuery('');
      setUploadError(null);
    },
    [markAsRecent, onChange],
  );

  const clearSelection = useCallback(() => {
    onChange(undefined);
    setUploadError(null);
  }, [onChange]);

  const uploadCustomEmoji = useCallback(async (file: File): Promise<UploadResult> => {
    if (!['image/png', 'image/jpeg', 'image/gif'].includes(file.type)) {
      const error = tStatic('emojiPicker.errors.invalidFileType');
      setUploadError(error);
      return { ok: false, error };
    }

    if (file.size > MAX_CUSTOM_EMOJI_FILE_SIZE) {
      const error = tStatic('emojiPicker.errors.maxUploadSize');
      setUploadError(error);
      return { ok: false, error };
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const token = createCustomEmojiToken(new Set(customEmojis.map((emoji) => emoji.token)));
      const nextCustomEmoji: CustomEmojiDefinition = {
        token,
        name:
          file.name.replace(/\.[a-zA-Z0-9]+$/, '')
          || tStatic('emojiPicker.customEmojiName'),
        mimeType: file.type,
        dataUrl,
        createdAt: new Date().toISOString(),
      };

      setCustomEmojis((previous) => [nextCustomEmoji, ...previous].slice(0, MAX_CUSTOM_EMOJIS));
      setUploadError(null);
      setSelectedCategory('custom');
      selectEmoji({
        key: nextCustomEmoji.token,
        value: nextCustomEmoji.token,
        name: nextCustomEmoji.name,
        keywords: ['custom', nextCustomEmoji.name],
        category: 'custom',
        isCustom: true,
        dataUrl,
      });

      return { ok: true };
    } catch {
      const error = tStatic('emojiPicker.errors.loadCustomEmojiFile');
      setUploadError(error);
      return { ok: false, error };
    }
  }, [customEmojis, selectEmoji]);

  const removeCustomEmoji = useCallback(
    (token: string) => {
      setCustomEmojis((previous) => previous.filter((emoji) => emoji.token !== token));
      setRecentKeys((previous) => previous.filter((key) => key !== token));
      if (value === token) {
        onChange(undefined);
      }
    },
    [onChange, value],
  );

  return {
    categories: EMOJI_CATEGORIES.filter((cat) => allowedCategories.includes(cat.id)),
    query,
    setQuery,
    isOpen,
    setIsOpen,
    selectedCategory,
    setSelectedCategory,
    skinTone,
    setSkinTone,
    selectedEmojiOption,
    recentlyUsed,
    suggestions,
    filteredSearchResults,
    categoryOptions,
    activeOptions,
    customEmojiOptions,
    uploadError,
    selectEmoji,
    clearSelection,
    uploadCustomEmoji,
    removeCustomEmoji,
  };
};
