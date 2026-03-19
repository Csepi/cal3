import React from 'react';

import { LanguageSwitcher } from '../LanguageSwitcher';
import { useAuth } from '../../hooks/useAuth';
import { useAppTranslation } from '../../i18n/useAppTranslation';

export const UserMenu: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { t } = useAppTranslation('common');

  const userName = currentUser?.username ?? '';
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="flex items-center gap-3">
      <LanguageSwitcher className="hidden lg:inline-flex" />
      <div className="hidden min-w-0 text-right md:block">
        <p className="truncate text-sm font-semibold text-slate-800">{userName}</p>
        <p className="text-[11px] uppercase tracking-wide text-slate-500">
          {isAdmin ? t('roles.admin') : t('navigation.profile')}
        </p>
      </div>
      <button
        type="button"
        onClick={logout}
        className="inline-flex min-h-11 items-center rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
      >
        {t('actions.logout')}
      </button>
    </div>
  );
};
