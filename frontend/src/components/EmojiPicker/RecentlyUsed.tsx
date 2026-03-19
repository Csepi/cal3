import React from 'react';

import { EmojiItem } from './EmojiItem';
import type { EmojiOption } from './types';

interface RecentlyUsedProps {
  emojis: EmojiOption[];
  activeIndex: number;
  onSelect: (option: EmojiOption) => void;
  onActivateIndex: (index: number) => void;
}

export const RecentlyUsed: React.FC<RecentlyUsedProps> = ({
  emojis,
  activeIndex,
  onSelect,
  onActivateIndex,
}) => {
  if (emojis.length === 0) {
    return null;
  }

  return (
    <section className="space-y-2" aria-label="Recently used emojis">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Recently used
      </h3>
      <div className="grid grid-cols-8 gap-1.5">
        {emojis.slice(0, 16).map((emoji, index) => (
          <EmojiItem
            key={`recent-${emoji.key}`}
            emoji={emoji}
            isActive={activeIndex === index}
            onSelect={onSelect}
            onMouseEnter={() => onActivateIndex(index)}
          />
        ))}
      </div>
    </section>
  );
};
