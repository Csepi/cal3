import React from 'react';

import type { NavigationItem } from './useNavigation';

interface NavItemProps {
  item: NavigationItem;
  active: boolean;
  onSelect: (item: NavigationItem) => void;
}

export const NavItem: React.FC<NavItemProps> = ({ item, active, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(item)}
    data-testid={`nav-${item.key}`}
    className={`
      relative inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition whitespace-nowrap
      ${active
        ? 'border-blue-300 bg-blue-50 text-blue-700 shadow-sm'
        : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-white'}
    `}
    aria-label={item.label}
    aria-current={active ? 'page' : undefined}
  >
    <span className="text-current" aria-hidden="true">{item.icon}</span>
    <span>{item.shortLabel ?? item.label}</span>
    {!!item.badge && item.badge > 0 && (
      <span className="inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-red-500 px-1 py-0.5 text-[0.65rem] font-semibold leading-none text-white">
        {item.badge > 99 ? '99+' : item.badge}
      </span>
    )}
  </button>
);
