import React from 'react';
import { createPortal } from 'react-dom';

import { useAppTranslation } from '../../i18n/useAppTranslation';
import type { NavigationItem } from './useNavigation';

interface MobileNavProps {
  primaryItems: NavigationItem[];
  secondaryItems: NavigationItem[];
  notificationItem?: NavigationItem | null;
  onSelect: (item: NavigationItem) => void;
  isItemActive: (item: NavigationItem) => boolean;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  primaryItems,
  secondaryItems,
  notificationItem,
  onSelect,
  isItemActive,
}) => {
  const { t } = useAppTranslation('common');
  const itemRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const [isMoreOpen, setIsMoreOpen] = React.useState(false);
  const moreRef = React.useRef<HTMLLIElement | null>(null);
  const moreButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const moreMenuRef = React.useRef<HTMLDivElement | null>(null);
  const [moreMenuStyle, setMoreMenuStyle] = React.useState<React.CSSProperties | null>(null);
  const activeInMore = secondaryItems.some((item) => isItemActive(item));

  const updateMoreMenuPosition = React.useCallback(() => {
    const button = moreButtonRef.current;
    if (!button) {
      return;
    }

    const rect = button.getBoundingClientRect();
    const menuWidth = Math.min(320, Math.max(220, window.innerWidth - 16));
    const left = Math.min(
      Math.max(8, rect.left),
      Math.max(8, window.innerWidth - menuWidth - 8),
    );

    setMoreMenuStyle({
      position: 'fixed',
      left,
      top: Math.max(8, rect.top - 8),
      width: menuWidth,
      transform: 'translateY(-100%)',
    });
  }, []);

  React.useEffect(() => {
    const allItems = [
      ...primaryItems,
      ...(notificationItem ? [notificationItem] : []),
      ...secondaryItems,
    ];
    const activeItem = allItems.find((item) => isItemActive(item));
    if (!activeItem) {
      return;
    }

    const element = itemRefs.current[activeItem.key];
    element?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [primaryItems, secondaryItems, notificationItem, isItemActive]);

  React.useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (moreRef.current?.contains(target) || moreMenuRef.current?.contains(target)) {
        return;
      }

      setIsMoreOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMoreOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  React.useEffect(() => {
    if (!isMoreOpen) {
      return;
    }

    updateMoreMenuPosition();

    const handleViewportChange = () => {
      updateMoreMenuPosition();
    };

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [isMoreOpen, updateMoreMenuPosition]);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[60] border-t border-slate-200 bg-white/95 shadow-[0_-8px_20px_rgba(15,23,42,0.08)] backdrop-blur-md"
      aria-label={t('navigation.primaryMobileAria', {
        defaultValue: 'Primary mobile navigation',
      })}
    >
      <div className="px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-1.5">
        <ul className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {primaryItems.map((item) => {
            const active = isItemActive(item);

            return (
              <li key={item.key} className="shrink-0">
                <button
                  ref={(node) => {
                    itemRefs.current[item.key] = node;
                  }}
                  type="button"
                  onClick={() => onSelect(item)}
                  data-testid={`mobile-nav-${item.key}`}
                  className={`flex min-h-[46px] min-w-[78px] flex-col items-center justify-center gap-1 rounded-xl border px-2 py-1.5 text-[11px] font-semibold transition ${
                    active
                      ? 'border-blue-300 bg-blue-50 text-blue-700'
                      : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50'
                  }`}
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
                  <span className="max-w-[110px] truncate">{item.label}</span>
                </button>
              </li>
            );
          })}
          {secondaryItems.length > 0 && (
            <li className="relative shrink-0" ref={moreRef}>
              <button
                ref={moreButtonRef}
                type="button"
                onClick={() => setIsMoreOpen((value) => !value)}
                data-testid="mobile-nav-more"
                className={`flex min-h-[46px] min-w-[92px] flex-col items-center justify-center gap-1 rounded-xl border px-2 py-1.5 text-[11px] font-semibold transition ${
                  isMoreOpen || activeInMore
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50'
                }`}
                aria-haspopup="menu"
                aria-expanded={isMoreOpen}
                aria-label={t('navigation.more', { defaultValue: 'More' })}
              >
                <span className="inline-flex">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="5" cy="12" r="1.3" />
                    <circle cx="12" cy="12" r="1.3" />
                    <circle cx="19" cy="12" r="1.3" />
                  </svg>
                </span>
                <span className="max-w-[110px] truncate">
                  {t('navigation.more', { defaultValue: 'More' })}
                </span>
              </button>
            </li>
          )}
          {notificationItem && (
            <li key={notificationItem.key} className="shrink-0">
              <button
                ref={(node) => {
                  itemRefs.current[notificationItem.key] = node;
                }}
                type="button"
                onClick={() => onSelect(notificationItem)}
                data-testid={`mobile-nav-${notificationItem.key}`}
                className={`flex min-h-[46px] min-w-[92px] flex-col items-center justify-center gap-1 rounded-xl border px-2 py-1.5 text-[11px] font-semibold transition ${
                  isItemActive(notificationItem)
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50'
                }`}
                aria-label={notificationItem.label}
                aria-current={isItemActive(notificationItem) ? 'page' : undefined}
              >
                <span className="relative inline-flex">
                  {notificationItem.icon}
                  {!!notificationItem.badge && notificationItem.badge > 0 && (
                    <span className="absolute -right-2 -top-1 inline-flex min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] text-white">
                      {notificationItem.badge > 99 ? '99+' : notificationItem.badge}
                    </span>
                  )}
                </span>
                <span className="max-w-[110px] truncate">{notificationItem.label}</span>
              </button>
            </li>
          )}
        </ul>
      </div>
      {isMoreOpen && moreMenuStyle && typeof document !== 'undefined' && createPortal(
        <div
          ref={moreMenuRef}
          className="z-[120] rounded-xl border border-slate-200 bg-white p-2 shadow-xl"
          style={moreMenuStyle}
          role="menu"
          aria-label={t('navigation.more', { defaultValue: 'More' })}
        >
          {secondaryItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setIsMoreOpen(false);
                onSelect(item);
              }}
              data-testid={`mobile-nav-more-${item.key}`}
              className={`mb-1 inline-flex min-h-11 w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium transition last:mb-0 ${
                isItemActive(item)
                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                  : 'border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-50'
              }`}
              role="menuitem"
              aria-current={isItemActive(item) ? 'page' : undefined}
            >
              <span aria-hidden="true">{item.icon}</span>
              <span className="flex-1 truncate">{item.label}</span>
            </button>
          ))}
        </div>,
        document.body,
      )}
    </nav>
  );
};
