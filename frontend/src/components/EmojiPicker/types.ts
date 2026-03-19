export type EmojiCategoryId =
  | 'smileys'
  | 'people'
  | 'nature'
  | 'food'
  | 'travel'
  | 'activities'
  | 'objects'
  | 'symbols'
  | 'custom';

export type SkinTone =
  | 'default'
  | 'light'
  | 'medium-light'
  | 'medium'
  | 'medium-dark'
  | 'dark';

export interface EmojiDefinition {
  id: string;
  emoji: string;
  name: string;
  category: Exclude<EmojiCategoryId, 'custom'>;
  keywords: string[];
  skinTones?: Partial<Record<Exclude<SkinTone, 'default'>, string>>;
}

export interface EmojiCategoryDefinition {
  id: Exclude<EmojiCategoryId, 'custom'>;
  label: string;
  icon: string;
}

export interface CustomEmojiDefinition {
  token: string;
  name: string;
  mimeType: string;
  dataUrl: string;
  createdAt: string;
}

export interface EmojiOption {
  key: string;
  value: string;
  name: string;
  keywords: string[];
  category: EmojiCategoryId;
  isCustom: boolean;
  dataUrl?: string;
}

export type PickerCategoryProp = 'calendar' | 'event' | 'resource' | 'all';
