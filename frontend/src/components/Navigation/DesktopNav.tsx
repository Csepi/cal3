import React from 'react';

import { useAppTranslation } from '../../i18n/useAppTranslation';
import { Breadcrumb } from './Breadcrumb';
import { NavItem } from './NavItem';
import { SearchNav } from './SearchNav';
import { UserMenu } from './UserMenu';
import type { NavigationItem } from './useNavigation';

interface DesktopNavProps {
  activeKey: string;
  primaryItems: NavigationItem[];
  secondaryItems: NavigationItem[];
  breadcrumbs: string[];
  onSelect: (item: NavigationItem) => void;
}

export const DesktopNav: React.FC<DesktopNavProps> = ({
  activeKey,
  primaryItems,
  secondaryItems,
  breadcrumbs,
  onSelect,
}) => {
  const { t } = useAppTranslation('common');
  const [isOverflowOpen, setIsOverflowOpen] = React.useState(false);
  const overflowRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!overflowRef.current?.contains(event.target as Node)) {
        setIsOverflowOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOverflowOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleSelect = (item: NavigationItem) => {
    setIsOverflowOpen(false);
    onSelect(item);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto max-w-7xl px-3 sm:px-4">
        <div className="flex min-h-[4.25rem] items-center gap-2 sm:gap-3">
          <div className="flex shrink-0 items-center gap-3">
            <img src="/primecal-icon.png" alt={t('app.title')} className="h-10 w-10" />
            <div className="leading-tight">
              <p className="text-base font-semibold text-slate-900">{t('app.title')}</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                {t('app.tagline', { defaultValue: 'Be in sync with reality' })}
              </p>
            </div>
          </div>

          <div className="hidden min-w-0 flex-1 items-center gap-2 md:flex">
            <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {primaryItems.map((item) => (
                <NavItem
                  key={item.key}
                  item={item}
                  active={activeKey === item.key}
                  onSelect={handleSelect}
                />
              ))}
            </div>

            {secondaryItems.length > 0 && (
              <div className="relative" ref={overflowRef}>
                <button
                  type="button"
                  className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                    isOverflowOpen
                      ? 'border-blue-300 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                  aria-haspopup="menu"
                  aria-expanded={isOverflowOpen}
                  onClick={() => setIsOverflowOpen((value) => !value)}
                >
                  {t('other', { defaultValue: 'More' })}
                  <svg
                    className={`h-4 w-4 transition-transform ${isOverflowOpen ? 'rotate-180' : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {isOverflowOpen && (
                  <div
                    className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"
                    role="menu"
                    aria-label={t('other', { defaultValue: 'More' })}
                  >
                    {secondaryItems.map((item) => (
                      <div key={item.key} className="mb-1 last:mb-0">
                        <NavItem
                          item={item}
                          active={activeKey === item.key}
                          onSelect={handleSelect}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <SearchNav className="hidden xl:block xl:w-[20rem]" />

          <div className="shrink-0">
            <UserMenu />
          </div>
        </div>

        <div className="hidden pb-2 md:block">
          <Breadcrumb items={breadcrumbs} />
        </div>
      </div>
    </nav>
  );
};
