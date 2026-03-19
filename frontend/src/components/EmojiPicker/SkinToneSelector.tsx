import React from 'react';

import type { SkinTone } from './types';

const SKIN_TONE_OPTIONS: Array<{ tone: SkinTone; label: string; preview: string }> = [
  { tone: 'default', label: 'Default', preview: '?' },
  { tone: 'light', label: 'Light', preview: '???' },
  { tone: 'medium-light', label: 'Medium-light', preview: '???' },
  { tone: 'medium', label: 'Medium', preview: '???' },
  { tone: 'medium-dark', label: 'Medium-dark', preview: '???' },
  { tone: 'dark', label: 'Dark', preview: '???' },
];

interface SkinToneSelectorProps {
  value: SkinTone;
  onChange: (tone: SkinTone) => void;
}

export const SkinToneSelector: React.FC<SkinToneSelectorProps> = ({ value, onChange }) => (
  <fieldset className="space-y-2" aria-label="Skin tone selector">
    <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">
      Skin tone
    </legend>
    <div className="flex flex-wrap gap-1.5">
      {SKIN_TONE_OPTIONS.map((option) => (
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
          aria-label={option.label}
          aria-pressed={value === option.tone}
          title={option.label}
        >
          <span aria-hidden="true">{option.preview}</span>
        </button>
      ))}
    </div>
  </fieldset>
);
