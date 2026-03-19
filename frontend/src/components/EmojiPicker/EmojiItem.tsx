import React from 'react';

import { EmojiGlyph } from './EmojiGlyph';
import type { EmojiOption } from './types';

interface EmojiItemProps {
  emoji: EmojiOption;
  isActive: boolean;
  onSelect: (emoji: EmojiOption) => void;
  onMouseEnter: () => void;
}

export const EmojiItem: React.FC<EmojiItemProps> = ({
  emoji,
  isActive,
  onSelect,
  onMouseEnter,
}) => (
  <button
    type="button"
    className={`
      flex h-11 w-11 items-center justify-center rounded-lg border text-xl transition-all
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1
      ${isActive ? 'border-blue-300 bg-blue-50 shadow-sm' : 'border-transparent hover:border-slate-200 hover:bg-slate-50'}
    `}
    aria-label={emoji.name}
    title={emoji.name}
    onClick={() => onSelect(emoji)}
    onMouseEnter={onMouseEnter}
  >
    {emoji.isCustom && emoji.dataUrl ? (
      <EmojiGlyph value={emoji.value} imageClassName="h-7 w-7 rounded object-cover" />
    ) : (
      <span aria-hidden="true">{emoji.value}</span>
    )}
  </button>
);
