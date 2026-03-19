import React from 'react';

import { useAppTranslation } from '../../i18n/useAppTranslation';
import type { SkinTone } from './types';

const SKIN_TONE_OPTIONS: Array<{ tone: SkinTone; key: string; preview: string }> = [
  { tone: 'default', key: 'default', preview: '\u{1F44B}' },
  { tone: 'light', key: 'light', preview: '\u{1F44B}\u{1F3FB}' },
  { tone: 'medium-light', key: 'mediumLight', preview: '\u{1F44B}\u{1F3FC}' },
  { tone: 'medium', key: 'medium', preview: '\u{1F44B}\u{1F3FD}' },
  { tone: 'medium-dark', key: 'mediumDark', preview: '\u{1F44B}\u{1F3FE}' },
  { tone: 'dark', key: 'dark', preview: '\u{1F44B}\u{1F3FF}' },
];

interface SkinToneSelectorProps {
  value: SkinTone;
  onChange: (tone: SkinTone) => void;
}

export const SkinToneSelector: React.FC<SkinToneSelectorProps> = ({ value, onChange }) => {
  const { t } = useAppTranslation('common');

  return (
    <fieldset
      className="space-y-2"
      aria-label={t('emojiPicker.skinToneSelectorAria', { defaultValue: 'Skin tone selector' })}
    >
      <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {t('emojiPicker.skinTone', { defaultValue: 'Skin tone' })}
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {SKIN_TONE_OPTIONS.map((option) => {
          const label = t(`emojiPicker.skinTones.${option.key}`, { defaultValue: option.key });

          return (
            <button
              key={option.tone}
              type="button"
              onClick={() => onChange(option.tone)}
              className={`
                inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm transition-all
                ${value === option.tone
                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}
              `}
              aria-label={label}
              aria-pressed={value === option.tone}
              title={label}
            >
              <span aria-hidden="true">{option.preview}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
};
