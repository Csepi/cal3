import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useAppTranslation } from '../../i18n/useAppTranslation';
import { EmojiCategory } from './EmojiCategory';
import { EmojiGlyph } from './EmojiGlyph';
import { EmojiSearch } from './EmojiSearch';
import { RecentlyUsed } from './RecentlyUsed';
import { SkinToneSelector } from './SkinToneSelector';
import { useEmojiPicker } from './useEmojiPicker';
import type { PickerCategoryProp } from './types';

export interface EmojiPickerProps {
  value?: string;
  onChange: (icon: string | undefined) => void;
  placeholder?: string;
  category?: PickerCategoryProp;
  className?: string;
  disabled?: boolean;
}

const GRID_COLUMNS = 8;

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  value,
  onChange,
  placeholder,
  category = 'all',
  className = '',
  disabled = false,
}) => {
  const { t } = useAppTranslation('common');
  const {
    categories,
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
    activeOptions,
    customEmojiOptions,
    uploadError,
    selectEmoji,
    clearSelection,
    uploadCustomEmoji,
    removeCustomEmoji,
  } = useEmojiPicker({ value, category, onChange });

  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const uploadRef = useRef<HTMLInputElement | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current) {
        return;
      }

      if (!rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isOpen, setIsOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 16);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, selectedCategory]);

  const localizedCategories = useMemo(
    () =>
      categories.map((candidate) => ({
        ...candidate,
        label: t(`emojiPicker.categories.${candidate.id}`, { defaultValue: candidate.label }),
      })),
    [categories, t],
  );

  const resolvedPlaceholder = placeholder ?? t('emojiPicker.selectEmoji', { defaultValue: 'Select emoji' });

  const categoryLabel = useMemo(() => {
    if (query.trim().length > 0) {
      return t('emojiPicker.searchResults', { defaultValue: 'Search results' });
    }

    if (selectedCategory === 'custom') {
      return t('emojiPicker.customEmojis', { defaultValue: 'Custom emojis' });
    }

    return localizedCategories.find((candidate) => candidate.id === selectedCategory)?.label
      ?? t('emojiPicker.emojis', { defaultValue: 'Emojis' });
  }, [localizedCategories, query, selectedCategory, t]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isOpen) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
      return;
    }

    if (activeOptions.length === 0) {
      return;
    }

    const currentIndex = Math.max(0, Math.min(activeIndex, activeOptions.length - 1));

    if (event.key === 'Enter') {
      event.preventDefault();
      selectEmoji(activeOptions[currentIndex]);
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      setActiveIndex((currentIndex + 1) % activeOptions.length);
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setActiveIndex((currentIndex - 1 + activeOptions.length) % activeOptions.length);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((currentIndex + GRID_COLUMNS) % activeOptions.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((currentIndex - GRID_COLUMNS + activeOptions.length) % activeOptions.length);
    }
  };

  const onUploadButtonClick = () => {
    uploadRef.current?.click();
  };

  const onUploadChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    await uploadCustomEmoji(selectedFile);
    event.currentTarget.value = '';
  };

  return (
    <div ref={rootRef} className={`relative ${className}`} onKeyDown={handleKeyDown}>
      <button
        type="button"
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm shadow-sm transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => setIsOpen((previous) => !previous)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={t('emojiPicker.open', { defaultValue: 'Open emoji picker' })}
        disabled={disabled}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selectedEmojiOption ? (
            <>
              {selectedEmojiOption.isCustom ? (
                <EmojiGlyph
                  value={selectedEmojiOption.value}
                  imageClassName="h-6 w-6 rounded object-cover"
                />
              ) : (
                <span className="text-2xl" aria-hidden="true">{selectedEmojiOption.value}</span>
              )}
              <span className="truncate text-slate-700">{selectedEmojiOption.name}</span>
            </>
          ) : (
            <span className="truncate text-slate-400">{resolvedPlaceholder}</span>
          )}
        </span>
        <svg
          className="h-4 w-4 shrink-0 text-slate-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute left-0 z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-2xl"
          role="dialog"
          aria-label={t('emojiPicker.dialogAria', { defaultValue: 'Emoji picker' })}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-800">
              {t('emojiPicker.title', { defaultValue: 'Emoji picker' })}
            </h2>
            <div className="flex items-center gap-1">
              {!!value && (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="rounded px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                >
                  {t('actions.clear')}
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                aria-label={t('emojiPicker.close', { defaultValue: 'Close emoji picker' })}
              >
                {t('actions.close')}
              </button>
            </div>
          </div>

          <EmojiSearch
            query={query}
            onQueryChange={setQuery}
            suggestions={suggestions}
            onSelectSuggestion={selectEmoji}
            inputRef={inputRef}
          />

          <div className="mt-3 space-y-3">
            <div className="overflow-x-auto pb-1">
              <div className="inline-flex min-w-full gap-1">
                {categories.map((pickerCategory) => (
                  <button
                    key={pickerCategory.id}
                    type="button"
                    onClick={() => setSelectedCategory(pickerCategory.id)}
                    className={`
                      inline-flex h-10 min-w-10 items-center justify-center rounded-lg border px-2 text-sm transition-all
                      ${selectedCategory === pickerCategory.id
                        ? 'border-blue-300 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'}
                    `}
                    aria-label={t(`emojiPicker.categories.${pickerCategory.id}`, { defaultValue: pickerCategory.label })}
                    aria-pressed={selectedCategory === pickerCategory.id}
                  >
                    <span aria-hidden="true">{pickerCategory.icon}</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSelectedCategory('custom')}
                  className={`
                    inline-flex h-10 min-w-10 items-center justify-center rounded-lg border px-2 text-sm transition-all
                    ${selectedCategory === 'custom'
                      ? 'border-blue-300 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'}
                  `}
                  aria-label={t('emojiPicker.customEmojis', { defaultValue: 'Custom emojis' })}
                  aria-pressed={selectedCategory === 'custom'}
                >
                  <span aria-hidden="true">🖼️</span>
                </button>
              </div>
            </div>

            {!query.trim() && (
              <RecentlyUsed
                emojis={recentlyUsed}
                activeIndex={activeIndex}
                onSelect={selectEmoji}
                onActivateIndex={setActiveIndex}
              />
            )}

            <SkinToneSelector value={skinTone} onChange={setSkinTone} />

            <div className="space-y-2 rounded-xl border border-dashed border-slate-300 bg-white p-2.5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  {t('emojiPicker.uploadHint', {
                    defaultValue: 'Custom emoji upload (PNG/JPG/GIF, max 1MB)',
                  })}
                </p>
                <button
                  type="button"
                  onClick={onUploadButtonClick}
                  className="rounded-lg border border-slate-300 bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  {t('actions.upload')}
                </button>
              </div>
              <input
                ref={uploadRef}
                type="file"
                accept="image/png,image/jpeg,image/gif"
                className="hidden"
                onChange={onUploadChange}
                aria-label={t('emojiPicker.upload', { defaultValue: 'Upload custom emoji' })}
              />
              {uploadError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700" role="alert">
                  {uploadError}
                </p>
              )}
              {customEmojiOptions.length > 0 && (
                <div className="max-h-20 overflow-y-auto">
                  <ul className="space-y-1">
                    {customEmojiOptions.slice(0, 12).map((emoji) => (
                      <li key={`custom-chip-${emoji.key}`} className="flex items-center justify-between gap-2 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-2 truncate">
                          <EmojiGlyph value={emoji.value} imageClassName="h-4 w-4 rounded object-cover" />
                          <span className="truncate">{emoji.name}</span>
                        </span>
                        <button
                          type="button"
                          className="rounded px-1 py-0.5 text-[11px] text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                          onClick={() => removeCustomEmoji(emoji.value)}
                        >
                          {t('actions.remove')}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <EmojiCategory
              title={categoryLabel}
              emojis={activeOptions}
              activeIndex={activeIndex}
              onSelect={selectEmoji}
              onActivateIndex={setActiveIndex}
              emptyLabel={query.trim()
                ? t('emojiPicker.emptySearch', { defaultValue: 'No emoji matched your search.' })
                : t('emojiPicker.emptyCategory', {
                  defaultValue: 'No emojis available in this category.',
                })}
            />
          </div>
        </div>
      )}
    </div>
  );
};
