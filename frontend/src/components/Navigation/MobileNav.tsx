import React from 'react';

import type { NavigationItem } from './useNavigation';

interface MobileNavProps {
  items: NavigationItem[];
  onSelect: (item: NavigationItem) => void;
  isItemActive: (item: NavigationItem) => boolean;
}

export const MobileNav: React.FC<MobileNavProps> = ({ items, onSelect, isItemActive }) => (
  <nav
    className="fixed bottom-0 left-0 right-0 z-[100001] border-t border-slate-200 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-1 shadow-[0_-8px_20px_rgba(15,23,42,0.1)]"
    aria-label="Primary mobile navigation"
  >
    <ul className="grid grid-cols-5 gap-1">
      {items.slice(0, 5).map((item) => {
        const active = isItemActive(item);

        return (
          <li key={item.key}>
            <button
              type="button"
              onClick={() => onSelect(item)}
              className={`
                flex min-h-[44px] w-full flex-col items-center justify-center gap-1 rounded-xl border px-2 py-1.5 text-[11px] font-semibold transition
                ${active
                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                  : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50'}
              `}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              <span className="relative inline-flex">
                {item.icon}
                {!!item.badge && item.badge > 0 && (
                  <span className="absolute -right-2 -top-1 inline-flex min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] text-white">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </span>
              <span className="truncate">{item.shortLabel ?? item.label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  </nav>
);
