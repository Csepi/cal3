import React from 'react';

import { LanguageSwitcher } from '../LanguageSwitcher';
import { useAuth } from '../../hooks/useAuth';
import { useAppTranslation } from '../../i18n/useAppTranslation';

interface UserMenuProps {
  onOpenProfileSettings?: () => void;
  onOpenAdmin?: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  onOpenProfileSettings,
  onOpenAdmin,
}) => {
  const { currentUser, logout } = useAuth();
  const { t } = useAppTranslation(['common', 'settings']);
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  const username = currentUser?.username ?? '';
  const fullName = [currentUser?.firstName, currentUser?.lastName]
    .filter((value): value is string => Boolean(value))
    .join(' ')
    .trim();
  const displayName = fullName || username;
  const initials = (displayName || 'U').slice(0, 1).toUpperCase();
  const isAdmin = currentUser?.role === 'admin';

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const closeMenu = () => setIsOpen(false);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
          isOpen
            ? 'border-blue-300 bg-blue-50 text-blue-700'
            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
        }`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={t('common:navigation.openProfileMenu', {
          defaultValue: 'Open profile menu',
        })}
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
          {initials}
        </span>
        <span className="hidden max-w-[8rem] truncate text-left lg:block">
          {displayName}
        </span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 z-30 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
          role="menu"
          aria-label={t('common:navigation.profile', { defaultValue: 'Profile' })}
        >
          <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="truncate text-sm font-semibold text-slate-800">{displayName}</p>
            {username && (
              <p className="truncate text-xs text-slate-500">@{username}</p>
            )}
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                closeMenu();
                onOpenProfileSettings?.();
              }}
              className="inline-flex min-h-11 w-full items-center rounded-lg border border-slate-200 px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              {t('common:navigation.profileSettings', { defaultValue: 'Profile settings' })}
            </button>

            <a
              href="https://docs.primecal.eu/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenu}
              className="inline-flex min-h-11 w-full items-center rounded-lg border border-slate-200 px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              aria-label={t('common:navigation.openDocumentation', {
                defaultValue: 'Open documentation in a new tab',
              })}
            >
              {t('common:navigation.documentation', { defaultValue: 'Documentation' })}
            </a>

            <div className="rounded-lg border border-slate-200 px-3 py-2">
              <LanguageSwitcher className="w-full" />
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  onOpenAdmin?.();
                }}
                className="inline-flex min-h-11 w-full items-center rounded-lg border border-slate-200 px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                {t('common:navigation.admin')}
              </button>
            )}

            <button
              type="button"
              onClick={async () => {
                closeMenu();
                await logout();
              }}
              className="inline-flex min-h-11 w-full items-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-left text-sm font-semibold text-red-600 transition hover:bg-red-100"
            >
              {t('common:actions.logout')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
