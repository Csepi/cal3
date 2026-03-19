import React from 'react';

interface SearchNavProps {
  onSearch?: (value: string) => void;
}

export const SearchNav: React.FC<SearchNavProps> = ({ onSearch }) => {
  const [value, setValue] = React.useState('');

  return (
    <form
      className="hidden min-w-[16rem] flex-1 md:block"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch?.(value);
      }}
      role="search"
      aria-label="Navigation search"
    >
      <label className="sr-only" htmlFor="primecal-nav-search">Search</label>
      <div className="relative">
        <input
          id="primecal-nav-search"
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Search calendar, events, or groups"
          className="w-full rounded-xl border border-slate-200 bg-white px-10 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
        <span className="pointer-events-none absolute left-3 top-2.5 text-slate-400" aria-hidden="true">??</span>
      </div>
    </form>
  );
};
