import React, { useEffect, useState } from 'react';

import { useAppTranslation } from '../../../i18n/useAppTranslation';
import { Button, Input, SimpleModal } from '../../ui';

interface GroupManagementModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialName?: string;
  initialVisible?: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (payload: { name: string; isVisible: boolean }) => Promise<void>;
}

export const GroupManagementModal: React.FC<GroupManagementModalProps> = ({
  isOpen,
  mode,
  initialName,
  initialVisible = true,
  loading = false,
  onClose,
  onSubmit,
}) => {
  const { t } = useAppTranslation('calendar');
  const [name, setName] = useState(initialName ?? '');
  const [isVisible, setIsVisible] = useState(initialVisible);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setName(initialName ?? '');
    setIsVisible(initialVisible);
    setError(null);
  }, [initialName, initialVisible, isOpen]);

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setError(
        t('groups.groupNameMinLength', {
          defaultValue: 'Group name must be at least 2 characters long.',
        }),
      );
      return;
    }

    setError(null);
    await onSubmit({ name: trimmedName, isVisible });
  };

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create'
        ? t('groups.createGroup', { defaultValue: 'Create group' })
        : t('groups.editGroup', { defaultValue: 'Edit group' })}
      size="md"
      fullScreenOnMobile
    >
      <div className="space-y-4">
        <Input
          label={t('groups.groupName', { defaultValue: 'Group name' })}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t('groups.groupNamePlaceholder', {
            defaultValue: 'Engineering, Personal, Family...',
          })}
          maxLength={120}
          required
          disabled={loading}
        />

        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={isVisible}
            onChange={(event) => setIsVisible(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600"
            disabled={loading}
          />
          {t('groups.visibleByDefault', { defaultValue: 'Visible by default' })}
        </label>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t('common:actions.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            {mode === 'create'
              ? t('groups.createGroup', { defaultValue: 'Create group' })
              : t('common:actions.save', { defaultValue: 'Save' })}
          </Button>
        </div>
      </div>
    </SimpleModal>
  );
};
