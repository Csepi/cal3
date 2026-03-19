import type { CustomEmojiDefinition } from './types';

export const CUSTOM_EMOJI_STORAGE_KEY = 'primecal:emoji-picker:custom-emojis';

const CUSTOM_TOKEN_PATTERN = /^:c[a-z0-9]{5}:$/;

const isStorageAvailable = (): boolean =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const isCustomEmojiToken = (value: string): boolean =>
  CUSTOM_TOKEN_PATTERN.test(value);

const parseStoredCustomEmojis = (raw: string | null): CustomEmojiDefinition[] => {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item): item is CustomEmojiDefinition => {
        if (!item || typeof item !== 'object') {
          return false;
        }

        const candidate = item as Record<string, unknown>;
        return (
          typeof candidate.token === 'string' &&
          typeof candidate.name === 'string' &&
          typeof candidate.mimeType === 'string' &&
          typeof candidate.dataUrl === 'string' &&
          typeof candidate.createdAt === 'string' &&
          isCustomEmojiToken(candidate.token)
        );
      })
      .slice(0, 80);
  } catch {
    return [];
  }
};

export const loadCustomEmojis = (): CustomEmojiDefinition[] => {
  if (!isStorageAvailable()) {
    return [];
  }

  return parseStoredCustomEmojis(window.localStorage.getItem(CUSTOM_EMOJI_STORAGE_KEY));
};

export const persistCustomEmojis = (customEmojis: CustomEmojiDefinition[]): void => {
  if (!isStorageAvailable()) {
    return;
  }

  window.localStorage.setItem(
    CUSTOM_EMOJI_STORAGE_KEY,
    JSON.stringify(customEmojis.slice(0, 80)),
  );
};

const makeTokenSuffix = (): string => {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let suffix = '';
  for (let index = 0; index < 5; index += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return suffix;
};

export const createCustomEmojiToken = (
  existingTokens: Set<string>,
): string => {
  let token = `:c${makeTokenSuffix()}:`;
  while (existingTokens.has(token)) {
    token = `:c${makeTokenSuffix()}:`;
  }
  return token;
};

export const findCustomEmojiByToken = (
  token: string,
  source?: CustomEmojiDefinition[],
): CustomEmojiDefinition | undefined => {
  const customEmojis = source ?? loadCustomEmojis();
  return customEmojis.find((emoji) => emoji.token === token);
};
