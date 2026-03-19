import React from 'react';
import { useAppTranslation } from '../../i18n/useAppTranslation';

interface SearchNavProps {
  onSearch?: (value: string) => void;
  className?: string;
}

export const SearchNav: React.FC<SearchNavProps> = ({ onSearch, className = '' }) => {
  const { t } = useAppTranslation('common');
  const [value, setValue] = React.useState('');

  return (
    <form
      className={`min-w-[16rem] ${className}`}
      onSubmit={(event) => {
        event.preventDefault();
        onSearch?.(value);
      }}
      role="search"
      aria-label={t('navigation.searchAria', { defaultValue: 'Navigation search' })}
    >
      <label className="sr-only" htmlFor="primecal-nav-search">
        {t('actions.search')}
      </label>
      <div className="relative">
        <input
          id="primecal-nav-search"
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={t('navigation.searchPlaceholder', {
            defaultValue: 'Search calendars, events, or groups',
          })}
          className="w-full rounded-xl border border-slate-200 bg-white px-10 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
        <span className="pointer-events-none absolute left-3 top-2.5 text-slate-400" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </span>
      </div>
    </form>
  );
};
