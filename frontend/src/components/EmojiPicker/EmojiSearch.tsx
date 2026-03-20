import React from 'react';

import { useAppTranslation } from '../../i18n/useAppTranslation';
import { EmojiGlyph } from './EmojiGlyph';
import type { EmojiOption } from './types';

interface EmojiSearchProps {
  query: string;
  onQueryChange: (nextQuery: string) => void;
  suggestions: EmojiOption[];
  onSelectSuggestion: (option: EmojiOption) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export const EmojiSearch: React.FC<EmojiSearchProps> = ({
  query,
  onQueryChange,
  suggestions,
  onSelectSuggestion,
  inputRef,
}) => {
  const { t } = useAppTranslation('common');
  const showSuggestions = query.trim().length > 0 && suggestions.length > 0;

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={t('emojiPicker.searchPlaceholder', { defaultValue: 'Search emoji' })}
        className="w-full rounded-xl border border-slate-300 bg-white px-10 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        role="searchbox"
        aria-label={t('emojiPicker.searchAria', { defaultValue: 'Search emoji' })}
        aria-autocomplete="list"
        aria-expanded={showSuggestions}
        aria-controls="emoji-search-suggestions"
      />
      <span className="pointer-events-none absolute left-3 top-2.5 text-slate-400" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </span>
      {query.length > 0 && (
        <button
          type="button"
          onClick={() => onQueryChange('')}
          className="absolute right-2.5 top-2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label={t('emojiPicker.clearSearch', { defaultValue: 'Clear emoji search' })}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}

      {showSuggestions && (
        <div
          id="emoji-search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-11 z-20 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
        >
          {suggestions.map((option) => (
            <button
              key={`suggestion-${option.key}`}
              type="button"
              role="option"
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100"
              onClick={() => onSelectSuggestion(option)}
            >
              {option.isCustom ? (
                <EmojiGlyph value={option.value} imageClassName="h-5 w-5 rounded object-cover" />
              ) : (
                <span aria-hidden="true">{option.value}</span>
              )}
              <span className="truncate">{option.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
