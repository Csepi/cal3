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

  return (
    <nav className="sticky top-0 z-[100000] border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-sm">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center gap-4">
          <div className="flex shrink-0 items-center gap-3">
            <img src="/primecal-icon.png" alt={t('app.title')} className="h-10 w-10" />
            <div className="leading-tight">
              <p className="text-base font-semibold text-slate-900">{t('app.title')}</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                {t('app.tagline', { defaultValue: 'Be in sync with reality' })}
              </p>
            </div>
          </div>

          <SearchNav />

          <div className="hidden flex-1 items-center justify-center gap-1 lg:flex">
            {primaryItems.map((item) => (
              <NavItem
                key={item.key}
                item={item}
                active={activeKey === item.key}
                onSelect={onSelect}
              />
            ))}

            {secondaryItems.length > 0 && (
              <details className="group relative">
                <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl border border-transparent px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-200 hover:bg-white">
                  More
                  <span aria-hidden="true" className="text-xs text-slate-400">?</span>
                </summary>
                <div className="absolute right-0 mt-1 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                  {secondaryItems.map((item) => (
                    <div key={item.key} className="mb-1 last:mb-0">
                      <NavItem
                        item={item}
                        active={activeKey === item.key}
                        onSelect={onSelect}
                      />
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>

          <UserMenu />
        </div>

        <Breadcrumb items={breadcrumbs} />
      </div>
    </nav>
  );
};
