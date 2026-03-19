import React from 'react';

import { EmojiPicker } from '../EmojiPicker/EmojiPicker';
import type { PickerCategoryProp } from '../EmojiPicker/types';

export interface IconPickerProps {
  value?: string;
  onChange: (icon: string | undefined) => void;
  placeholder?: string;
  category?: PickerCategoryProp;
  className?: string;
  disabled?: boolean;
}

export const IconPicker: React.FC<IconPickerProps> = ({
  value,
  onChange,
  placeholder,
  category = 'all',
  className,
  disabled,
}) => (
  <EmojiPicker
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    category={category}
    className={className}
    disabled={disabled}
  />
);
