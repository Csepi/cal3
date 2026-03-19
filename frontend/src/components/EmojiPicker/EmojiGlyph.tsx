import React from 'react';

import { findCustomEmojiByToken, isCustomEmojiToken } from './customEmojis';

interface EmojiGlyphProps {
  value: string;
  className?: string;
  imageClassName?: string;
  fallbackLabel?: string;
}

export const EmojiGlyph: React.FC<EmojiGlyphProps> = ({
  value,
  className = '',
  imageClassName = 'h-5 w-5 rounded object-cover',
  fallbackLabel = 'emoji',
}) => {
  if (isCustomEmojiToken(value)) {
    const customEmoji = findCustomEmojiByToken(value);
    if (customEmoji) {
      return (
        <img
          src={customEmoji.dataUrl}
          alt={customEmoji.name}
          className={imageClassName}
          loading="lazy"
        />
      );
    }
  }

  return <span className={className} aria-label={fallbackLabel}>{value}</span>;
};
