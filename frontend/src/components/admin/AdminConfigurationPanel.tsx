import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  ConfigurationOverview,
  ConfigurationSettingSummary,
} from './types';
import {
  fetchConfigurationOverview,
  formatAdminError,
  updateConfigurationSetting,
} from './adminApiService';
import { useAppTranslation } from '../../i18n/useAppTranslation';

interface AdminConfigurationPanelProps {
  themeColor?: string;
}

type DraftValue = string | boolean;

type SettingSource = ConfigurationSettingSummary['source'];

const SOURCE_LABEL_KEYS: Record<SettingSource, string> = {
  database: 'admin:runtimeConfig.source.database',
  environment: 'admin:runtimeConfig.source.environment',
  default: 'admin:runtimeConfig.source.default',
};

const SOURCE_LABEL_DEFAULTS: Record<SettingSource, string> = {
  database: 'Database override',
  environment: 'Environment variable',
  default: 'Default fallback',
};

const SOURCE_STYLES: Record<SettingSource, string> = {
  database: 'border-blue-200 bg-blue-50 text-blue-700',
  environment: 'border-amber-200 bg-amber-50 text-amber-700',
  default: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

const CATEGORY_ORDER: ConfigurationOverview['categories'][number]['key'][] = [
  'oauth',
  'environment',
  'feature-flags',
  'notifications',
];

const asString = (value: string | boolean | null | undefined): string =>
  typeof value === 'string' ? value : '';

const asBoolean = (value: string | boolean | null | undefined): boolean =>
  value === true || value === 'true';

const AdminConfigurationPanel: React.FC<AdminConfigurationPanelProps> = ({
  themeColor = '#3b82f6',
}) => {
  const { t } = useAppTranslation(['admin', 'common']);
  const [overview, setOverview] = useState<ConfigurationOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);
  const [draftValues, setDraftValues] = useState<Record<string, DraftValue>>({});
  const [activeCategory, setActiveCategory] =
    useState<ConfigurationOverview['categories'][number]['key']>('oauth');
  const [searchTerm, setSearchTerm] = useState('');

  const displayValue = useCallback(
    (setting: ConfigurationSettingSummary, value: string | boolean | null): string => {
      if (value === null || value === undefined || value === '') {
        return t('admin:runtimeConfig.notSetValue', { defaultValue: 'Not set' });
      }

      if (setting.valueType === 'boolean') {
        return value === true || value === 'true'
          ? t('admin:runtimeConfig.enabled', { defaultValue: 'Enabled' })
          : t('admin:runtimeConfig.disabled', { defaultValue: 'Disabled' });
      }

      return String(value);
    },
    [t],
  );

  const themeGradient = useMemo(
    () =>
      `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}CC 40%, #1d4ed8 100%)`,
    [themeColor],
  );

  const loadConfiguration = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchConfigurationOverview();
      setOverview(data);
      setError(null);
    } catch (err) {
      setError(formatAdminError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfiguration().catch((err) => {
      setError(formatAdminError(err));
      setLoading(false);
    });
  }, [loadConfiguration]);

  useEffect(() => {
    if (!overview) {
      return;
    }

    const nextDrafts: Record<string, DraftValue> = {};
    overview.categories.forEach((category) => {
      category.settings.forEach((setting) => {
        if (setting.valueType === 'boolean') {
          nextDrafts[setting.key] = asBoolean(setting.value);
          return;
        }

        if (setting.valueType === 'enum') {
          nextDrafts[setting.key] =
            asString(setting.value) || setting.options?.[0] || '';
          return;
        }

        nextDrafts[setting.key] = asString(setting.value);
      });
    });

    setDraftValues(nextDrafts);

    if (!overview.categories.some((category) => category.key === activeCategory)) {
      const ordered = [...overview.categories].sort((a, b) => {
        const left = CATEGORY_ORDER.indexOf(a.key);
        const right = CATEGORY_ORDER.indexOf(b.key);
        return (left < 0 ? Number.MAX_SAFE_INTEGER : left) -
          (right < 0 ? Number.MAX_SAFE_INTEGER : right);
      });
      setActiveCategory(ordered[0]?.key ?? 'oauth');
    }
  }, [activeCategory, overview]);

  const orderedCategories = useMemo(() => {
    if (!overview) {
      return [];
    }

    return [...overview.categories].sort((a, b) => {
      const left = CATEGORY_ORDER.indexOf(a.key);
      const right = CATEGORY_ORDER.indexOf(b.key);
      return (left < 0 ? Number.MAX_SAFE_INTEGER : left) -
        (right < 0 ? Number.MAX_SAFE_INTEGER : right);
    });
  }, [overview]);

  const activeCategorySettings = useMemo(() => {
    const category = orderedCategories.find((entry) => entry.key === activeCategory);
    if (!category) {
      return [];
    }

    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) {
      return category.settings;
    }

    return category.settings.filter((setting) => {
      const haystack = [setting.label, setting.description, setting.key]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [activeCategory, orderedCategories, searchTerm]);

  const activeCategorySummary = useMemo(
    () => orderedCategories.find((entry) => entry.key === activeCategory) ?? null,
    [activeCategory, orderedCategories],
  );

  const getDraftValue = (setting: ConfigurationSettingSummary): DraftValue => {
    const cached = draftValues[setting.key];

    if (cached !== undefined) {
      return cached;
    }

    if (setting.valueType === 'boolean') {
      return asBoolean(setting.value);
    }

    if (setting.valueType === 'enum') {
      return asString(setting.value) || setting.options?.[0] || '';
    }

    return asString(setting.value);
  };

  const isDirty = (setting: ConfigurationSettingSummary): boolean => {
    const draft = getDraftValue(setting);

    if (setting.valueType === 'secret') {
      return typeof draft === 'string' && draft.trim().length > 0;
    }

    if (setting.valueType === 'boolean') {
      return Boolean(draft) !== asBoolean(setting.value);
    }

    const current =
      setting.valueType === 'enum'
        ? asString(setting.value) || setting.options?.[0] || ''
        : asString(setting.value);

    return String(draft) !== current;
  };

  const handleRevertDraft = (setting: ConfigurationSettingSummary) => {
    const resetValue =
      setting.valueType === 'boolean'
        ? asBoolean(setting.value)
        : setting.valueType === 'enum'
          ? asString(setting.value) || setting.options?.[0] || ''
          : asString(setting.value);

    setDraftValues((prev) => ({
      ...prev,
      [setting.key]: resetValue,
    }));
  };

  const handleSaveSetting = async (setting: ConfigurationSettingSummary) => {
    const draft = getDraftValue(setting);

    let payload: string | boolean | null;
    if (setting.valueType === 'boolean') {
      payload = Boolean(draft);
    } else if (setting.valueType === 'enum') {
      const nextValue = String(draft).trim();
      payload = nextValue === '' ? null : nextValue;
    } else if (setting.valueType === 'secret') {
      const nextValue = String(draft);
      if (nextValue.trim() === '') {
        return;
      }
      payload = nextValue;
    } else {
      const nextValue = String(draft);
      payload = nextValue.trim() === '' ? null : nextValue;
    }

    try {
      setUpdatingKey(setting.key);
      const updated = await updateConfigurationSetting(setting.key, payload);
      setSuccessMessage(`${updated.label || updated.key} saved.`);
      await loadConfiguration();
    } catch (err) {
      setError(formatAdminError(err));
    } finally {
      setUpdatingKey(null);
    }
  };

  const handleRestoreDefault = async (setting: ConfigurationSettingSummary) => {
    try {
      setUpdatingKey(setting.key);
      const updated = await updateConfigurationSetting(setting.key, null);
      setSuccessMessage(`${updated.label || updated.key} now uses default.`);
      await loadConfiguration();
    } catch (err) {
      setError(formatAdminError(err));
    } finally {
      setUpdatingKey(null);
    }
  };

  const renderControl = (setting: ConfigurationSettingSummary) => {
    const disabled = !setting.isEditable || setting.isReadOnly || updatingKey === setting.key;
    const draft = getDraftValue(setting);

    if (setting.valueType === 'boolean') {
      const boolDraft = Boolean(draft);
      return (
        <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
          <button
            type="button"
            onClick={() =>
              setDraftValues((prev) => ({
                ...prev,
                [setting.key]: true,
              }))
            }
            disabled={disabled}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              boolDraft
                ? 'bg-emerald-600 text-white shadow'
                : 'text-gray-600 hover:bg-gray-100'
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {t('admin:runtimeConfig.enabled', { defaultValue: 'Enabled' })}
          </button>
          <button
            type="button"
            onClick={() =>
              setDraftValues((prev) => ({
                ...prev,
                [setting.key]: false,
              }))
            }
            disabled={disabled}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              !boolDraft
                ? 'bg-slate-700 text-white shadow'
                : 'text-gray-600 hover:bg-gray-100'
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {t('admin:runtimeConfig.disabled', { defaultValue: 'Disabled' })}
          </button>
        </div>
      );
    }

    if (setting.valueType === 'enum') {
      return (
        <select
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
          value={String(draft)}
          onChange={(event) =>
            setDraftValues((prev) => ({
              ...prev,
              [setting.key]: event.target.value,
            }))
          }
          disabled={disabled}
        >
          {(setting.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    if (setting.valueType === 'secret') {
      return (
        <input
          type="password"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
          value={String(draft)}
          onChange={(event) =>
            setDraftValues((prev) => ({
              ...prev,
              [setting.key]: event.target.value,
            }))
          }
          disabled={disabled}
          placeholder={
            setting.hasValue
              ? t('admin:runtimeConfig.secretConfiguredPlaceholder', {
                  defaultValue: 'Secret configured. Enter a new value to replace it.',
                })
              : t('admin:runtimeConfig.secretEnterPlaceholder', {
                  defaultValue: 'Enter secret value',
                })
          }
          autoComplete="off"
        />
      );
    }

    return (
      <input
        type="text"
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
        value={String(draft)}
        onChange={(event) =>
          setDraftValues((prev) => ({
            ...prev,
            [setting.key]: event.target.value,
          }))
        }
        disabled={disabled}
        placeholder={
          setting.hasValue
            ? t('admin:runtimeConfig.configuredValuePlaceholder', {
                defaultValue: 'Configured value',
              })
            : t('admin:runtimeConfig.notSetValue', { defaultValue: 'Not set' })
        }
      />
    );
  };

  const renderSettingActions = (setting: ConfigurationSettingSummary) => {
    const disabled = !setting.isEditable || setting.isReadOnly || updatingKey === setting.key;
    const dirty = isDirty(setting);

    return (
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => handleSaveSetting(setting)}
          disabled={
            disabled ||
            !dirty ||
            (setting.valueType === 'secret' &&
              String(getDraftValue(setting)).trim().length === 0)
          }
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {t('admin:runtimeConfig.saveAction', { defaultValue: 'Save' })}
        </button>

        <button
          type="button"
          onClick={() => handleRevertDraft(setting)}
          disabled={disabled || !dirty}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400"
        >
          {t('admin:runtimeConfig.revertDraftAction', {
            defaultValue: 'Revert draft',
          })}
        </button>

        <button
          type="button"
          onClick={() => handleRestoreDefault(setting)}
          disabled={disabled}
          className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 shadow-sm hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t('admin:runtimeConfig.restoreDefaultAction', {
            defaultValue: 'Restore default',
          })}
        </button>
      </div>
    );
  };

  const renderSetting = (setting: ConfigurationSettingSummary) => {
    const requiresRestart = setting.metadata?.requiresRestart === true;
    const isUpdating = updatingKey === setting.key;

    return (
      <article
        key={setting.key}
        className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-gray-900">{setting.label}</h3>
            {setting.description && (
              <p className="mt-1 text-sm text-gray-600">{setting.description}</p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <code className="rounded bg-gray-100 px-2 py-1 font-mono text-gray-700">
                {setting.key}
              </code>
              <span
                className={`rounded-full border px-2 py-1 font-medium ${SOURCE_STYLES[setting.source]}`}
              >
                {t(SOURCE_LABEL_KEYS[setting.source], {
                  defaultValue: SOURCE_LABEL_DEFAULTS[setting.source],
                })}
              </span>
              {setting.isSensitive && (
                <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-1 font-medium text-rose-700">
                  {t('admin:runtimeConfig.sensitiveTag', {
                    defaultValue: 'Sensitive',
                  })}
                </span>
              )}
              {requiresRestart && (
                <span className="rounded-full border border-purple-200 bg-purple-50 px-2 py-1 font-medium text-purple-700">
                  {t('admin:runtimeConfig.restartRequiredTag', {
                    defaultValue: 'Restart required',
                  })}
                </span>
              )}
              {setting.isReadOnly && (
                <span className="rounded-full border border-gray-300 bg-gray-100 px-2 py-1 font-medium text-gray-600">
                  {t('admin:runtimeConfig.readOnlyTag', { defaultValue: 'Read only' })}
                </span>
              )}
              {isUpdating && (
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 font-medium text-blue-700">
                  {t('admin:runtimeConfig.savingTag', { defaultValue: 'Saving...' })}
                </span>
              )}
            </div>
          </div>

          <div className="min-w-[220px] space-y-1 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
            <div>
              {t('admin:runtimeConfig.currentValueLabel', {
                defaultValue: 'Current value:',
              })}{' '}
              <span className="font-medium text-gray-800">
                {displayValue(setting, setting.value)}
              </span>
            </div>
            <div>
              {t('admin:runtimeConfig.defaultValueLabel', {
                defaultValue: 'Default value:',
              })}{' '}
              <span className="font-medium text-gray-800">
                {displayValue(setting, setting.defaultValue)}
              </span>
            </div>
            {setting.updatedAt && (
              <div>
                {t('admin:runtimeConfig.updatedLabel', {
                  defaultValue: 'Updated:',
                })}{' '}
                {new Date(setting.updatedAt).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          {renderControl(setting)}
          {renderSettingActions(setting)}
        </div>
      </article>
    );
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500" />
          <p className="text-gray-600">
            {t('admin:runtimeConfig.loadingMessage', {
              defaultValue: 'Loading runtime configuration...',
            })}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
        <h2 className="text-lg font-semibold">
          {t('admin:runtimeConfig.errorTitle', {
            defaultValue: 'Configuration error',
          })}
        </h2>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }

  if (!overview) {
    return null;
  }

  return (
    <div className="space-y-6">
      <section
        className="rounded-3xl border border-blue-200 p-6 shadow-lg"
        style={{ backgroundImage: themeGradient }}
      >
        <div className="rounded-2xl border border-white/40 bg-white/90 p-5 backdrop-blur">
          <h1 className="text-2xl font-semibold text-gray-900">
            {t('admin:runtimeConfig.title', {
              defaultValue: 'Runtime Configuration',
            })}
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            {t('admin:runtimeConfig.descriptionPrefix', {
              defaultValue:
                'Manage runtime overrides for OAuth, environment, feature flags, and notifications. Use',
            })}{' '}
            <strong>
              {t('admin:runtimeConfig.restoreDefaultAction', {
                defaultValue: 'Restore default',
              })}
            </strong>{' '}
            {t('admin:runtimeConfig.descriptionSuffix', {
              defaultValue:
                'on any setting to return to calculated fallback behavior.',
            })}
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <span className="font-medium text-slate-700">
                {t('admin:runtimeConfig.backendUrlLabel', {
                  defaultValue: 'Resolved backend URL:',
                })}
              </span>{' '}
              <code className="font-mono text-slate-900">{overview.derived.backendBaseUrl}</code>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <span className="font-medium text-slate-700">
                {t('admin:runtimeConfig.frontendUrlLabel', {
                  defaultValue: 'Resolved frontend URL:',
                })}
              </span>{' '}
              <code className="font-mono text-slate-900">{overview.derived.frontendBaseUrl}</code>
            </div>
          </div>

          {successMessage && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
              {successMessage}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {orderedCategories.map((category) => {
              const isActive = category.key === activeCategory;
              return (
                <button
                  key={category.key}
                  type="button"
                  onClick={() => setActiveCategory(category.key)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow'
                      : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {category.label} ({category.settings.length})
                </button>
              );
            })}
          </div>

          <div className="w-full lg:max-w-sm">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t('admin:runtimeConfig.searchPlaceholder', {
                defaultValue: 'Search by key, label, or description',
              })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {activeCategorySummary?.description && (
          <p className="mt-3 text-sm text-gray-600">{activeCategorySummary.description}</p>
        )}
      </section>

      <section className="space-y-3">
        {activeCategorySettings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-600">
            {t('admin:runtimeConfig.noMatchesMessage', {
              defaultValue: 'No settings match your current filter.',
            })}
          </div>
        ) : (
          activeCategorySettings.map((setting) => renderSetting(setting))
        )}
      </section>

      <section className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-indigo-900">
          {t('admin:runtimeConfig.oauthPreviewTitle', {
            defaultValue: 'Computed OAuth Callback Preview',
          })}
        </h2>
        <p className="mt-1 text-sm text-indigo-800">
          {t('admin:runtimeConfig.oauthPreviewDescription', {
            defaultValue:
              'These are the callback URLs currently resolved from your runtime configuration.',
          })}
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {overview.derived.oauthCallbacks.map((callback) => (
            <div
              key={callback.provider}
              className="rounded-xl border border-indigo-200 bg-white p-4"
            >
              <h3 className="text-sm font-semibold uppercase tracking-wide text-indigo-900">
                {callback.provider}
              </h3>
              <div className="mt-3 space-y-2 text-xs text-indigo-900">
                <div>
                  <p className="font-medium">
                    {t('admin:runtimeConfig.authCallbackLabel', {
                      defaultValue: 'Auth callback',
                    })}
                  </p>
                  <code className="mt-1 block break-all rounded bg-indigo-100 px-2 py-1 font-mono">
                    {callback.authCallback}
                  </code>
                </div>
                <div>
                  <p className="font-medium">
                    {t('admin:runtimeConfig.calendarSyncCallbackLabel', {
                      defaultValue: 'Calendar sync callback',
                    })}
                  </p>
                  <code className="mt-1 block break-all rounded bg-indigo-100 px-2 py-1 font-mono">
                    {callback.calendarSyncCallback}
                  </code>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminConfigurationPanel;
