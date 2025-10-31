import React, { useEffect, useMemo, useState } from 'react';
import type {
  ConfigurationOverview,
  ConfigurationSettingSummary,
} from './types';
import {
  fetchConfigurationOverview,
  updateConfigurationSetting,
  formatAdminError,
} from './adminApiService';

interface AdminConfigurationPanelProps {
  themeColor?: string;
  isActive?: boolean;
}

const booleanDisplay = (value: boolean) => (value ? 'Enabled' : 'Disabled');

const AdminConfigurationPanel: React.FC<AdminConfigurationPanelProps> = ({
  themeColor = '#3b82f6',
}) => {
  const [overview, setOverview] = useState<ConfigurationOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});

  const themeGradient = useMemo(
    () => ({
      gradient: `linear-gradient(135deg, ${themeColor}, #1d4ed8)`,
    }),
    [themeColor],
  );

  useEffect(() => {
    const loadConfiguration = async () => {
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
    };

    loadConfiguration().catch((err) => {
      setError(formatAdminError(err));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!overview) {
      return;
    }
    const nextDrafts: Record<string, string> = {};
    overview.categories.forEach((category) => {
      category.settings.forEach((setting) => {
        if (typeof setting.value === 'string') {
          nextDrafts[setting.key] = setting.value;
        } else {
          nextDrafts[setting.key] = '';
        }
      });
    });
    setDraftValues(nextDrafts);
  }, [overview]);

  const applyUpdatedSetting = (updated: ConfigurationSettingSummary) => {
    setOverview((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        categories: prev.categories.map((category) => {
          if (!category.settings.some((setting) => setting.key === updated.key)) {
            return category;
          }
          return {
            ...category,
            settings: category.settings.map((setting) =>
              setting.key === updated.key ? { ...setting, ...updated } : setting,
            ),
          };
        }),
      };
    });

    setDraftValues((prev) => ({
      ...prev,
      [updated.key]:
        typeof updated.value === 'string' ? updated.value : '',
    }));
  };

  const handleSettingUpdate = async (
    setting: ConfigurationSettingSummary,
    value: string | boolean | null,
  ) => {
    try {
      setUpdatingKey(setting.key);
      const updated = await updateConfigurationSetting(setting.key, value);
      applyUpdatedSetting(updated);
      setSuccessMessage(`${updated.label || updated.key} updated successfully`);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err) {
      setError(formatAdminError(err));
    } finally {
      setUpdatingKey(null);
    }
  };

  const renderStringControl = (setting: ConfigurationSettingSummary) => {
    const draft = draftValues[setting.key] ?? '';
    const original = typeof setting.value === 'string' ? setting.value : '';
    const isDirty = draft !== original;
    const disabled = !setting.isEditable || setting.isReadOnly;

    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          className="w-full flex-1 rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
          value={draft}
          onChange={(event) =>
            setDraftValues((prev) => ({
              ...prev,
              [setting.key]: event.target.value,
            }))
          }
          disabled={disabled || updatingKey === setting.key}
          placeholder={setting.hasValue ? 'Value configured' : 'Not set'}
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              handleSettingUpdate(
                setting,
                draft.trim() === '' ? null : draft,
              )
            }
            disabled={
              disabled ||
              updatingKey === setting.key ||
              (!isDirty && draft.trim() !== '')
            }
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setDraftValues((prev) => ({
                ...prev,
                [setting.key]: original,
              }));
            }}
            disabled={disabled || updatingKey === setting.key || !isDirty}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400"
          >
            Revert
          </button>
          <button
            type="button"
            onClick={() => handleSettingUpdate(setting, null)}
            disabled={disabled || updatingKey === setting.key}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-red-300"
          >
            Restore default
          </button>
        </div>
      </div>
    );
  };

  const renderEnumControl = (setting: ConfigurationSettingSummary) => {
    const disabled = !setting.isEditable || setting.isReadOnly;
    const currentValue =
      (typeof setting.value === 'string' && setting.value) ||
      setting.options?.[0] ||
      '';

    return (
      <select
        className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
        value={currentValue}
        onChange={(event) =>
          handleSettingUpdate(setting, event.target.value)
        }
        disabled={disabled || updatingKey === setting.key}
      >
        {setting.options?.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  };

  const renderBooleanControl = (setting: ConfigurationSettingSummary) => {
    const disabled = !setting.isEditable || setting.isReadOnly;
    const value = Boolean(setting.value);

    return (
      <label className="inline-flex items-center gap-3">
        <span
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
            value ? 'bg-blue-600' : 'bg-gray-300'
          } ${disabled ? 'opacity-60' : ''}`}
        >
          <input
            type="checkbox"
            className="sr-only"
            checked={value}
            onChange={() => handleSettingUpdate(setting, !value)}
            disabled={disabled || updatingKey === setting.key}
          />
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
              value ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </span>
        <span className="text-sm font-medium text-gray-700">
          {booleanDisplay(value)}
        </span>
      </label>
    );
  };

  const renderSecretControl = (setting: ConfigurationSettingSummary) => {
    const draft = draftValues[setting.key] ?? '';
    const disabled = !setting.isEditable || setting.isReadOnly;

    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="password"
          className="w-full flex-1 rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
          value={draft}
          onChange={(event) =>
            setDraftValues((prev) => ({
              ...prev,
              [setting.key]: event.target.value,
            }))
          }
          disabled={disabled || updatingKey === setting.key}
          placeholder={
            setting.hasValue ? '••••••••' : 'Enter new secret value'
          }
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              handleSettingUpdate(
                setting,
                draft.trim() === '' ? null : draft,
              )
            }
            disabled={
              disabled ||
              updatingKey === setting.key ||
              draft.trim().length === 0
            }
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            Save secret
          </button>
          <button
            type="button"
            onClick={() => {
              setDraftValues((prev) => ({
                ...prev,
                [setting.key]: '',
              }));
              handleSettingUpdate(setting, null);
            }}
            disabled={disabled || updatingKey === setting.key}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-red-300"
          >
            Clear secret
          </button>
        </div>
      </div>
    );
  };

  const renderSettingControl = (setting: ConfigurationSettingSummary) => {
    switch (setting.valueType) {
      case 'boolean':
        return renderBooleanControl(setting);
      case 'enum':
        return renderEnumControl(setting);
      case 'secret':
        return renderSecretControl(setting);
      default:
        return renderStringControl(setting);
    }
  };

  const renderSetting = (setting: ConfigurationSettingSummary) => {
    const requiresRestart = setting.metadata?.requiresRestart === true;
    const isUpdating = updatingKey === setting.key;

    return (
      <div
        key={setting.key}
        className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white/70 p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              {setting.label}
            </h3>
            <p className="text-sm text-gray-500">{setting.description}</p>
          </div>
          <div className="flex items-center gap-2">
            {setting.isSensitive && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                Sensitive
              </span>
            )}
            {requiresRestart && (
              <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                Restart required
              </span>
            )}
            {setting.isReadOnly && (
              <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
                Read only
              </span>
            )}
          </div>
        </div>

        {renderSettingControl(setting)}

        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
          <span className="font-mono text-gray-600">{setting.key}</span>
          <span>•</span>
          <span>
            Status:{' '}
            {setting.hasValue
              ? 'Configured'
              : setting.isEditable
              ? 'Using default'
              : 'Managed externally'}
          </span>
          {isUpdating && (
            <>
              <span>•</span>
              <span className="text-blue-600">Saving…</span>
            </>
          )}
          {setting.updatedAt && (
            <>
              <span>•</span>
              <span>
                Updated{' '}
                {new Date(setting.updatedAt).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500" />
          <p className="text-gray-600">Loading configuration…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
        <h2 className="text-lg font-semibold">Failed to load configuration</h2>
        <p className="mt-2">{error}</p>
      </div>
    );
  }

  if (!overview) {
    return null;
    }

  return (
    <div className="space-y-8">
      <div
        className="rounded-3xl border border-blue-200 bg-white/80 p-6 shadow-xl"
        style={{ backgroundImage: themeGradient.gradient }}
      >
        <div className="rounded-2xl bg-white/90 p-6 shadow-inner">
          <h1 className="text-2xl font-semibold text-gray-900">
            Runtime Configuration
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage non-destructive environment settings, OAuth credentials, and
            feature flags without redeploying infrastructure.
          </p>
          <div className="mt-4 grid gap-4 text-sm text-gray-700 sm:grid-cols-2">
            <div>
              <span className="font-medium text-gray-900">Backend base URL:</span>{' '}
              <span className="font-mono">{overview.derived.backendBaseUrl}</span>
            </div>
            <div>
              <span className="font-medium text-gray-900">Frontend base URL:</span>{' '}
              <span className="font-mono">{overview.derived.frontendBaseUrl}</span>
            </div>
          </div>
          {successMessage && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 shadow">
              {successMessage}
            </div>
          )}
        </div>
      </div>

      {overview.categories.map((category) => (
        <section
          key={category.key}
          className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-lg"
        >
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {category.label}
            </h2>
            {category.description && (
              <p className="mt-1 text-sm text-gray-600">
                {category.description}
              </p>
            )}
          </div>

          <div className="mt-6 grid gap-5">
            {category.settings.map((setting) => renderSetting(setting))}
          </div>
        </section>
      ))}

      <section className="rounded-3xl border border-indigo-200 bg-indigo-50/60 p-6 shadow-inner">
        <div className="border-b border-indigo-200 pb-4">
          <h2 className="text-xl font-semibold text-indigo-900">
            OAuth Callback URLs
          </h2>
          <p className="mt-1 text-sm text-indigo-700">
            These values are derived automatically from the backend runtime
            configuration and are read-only. Use them when registering redirect
            URIs with identity providers.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {overview.derived.oauthCallbacks.map((callback) => (
            <div
              key={callback.provider}
              className="rounded-2xl border border-indigo-200 bg-white/80 p-4 shadow-sm"
            >
              <h3 className="text-lg font-semibold capitalize text-indigo-900">
                {callback.provider} provider
              </h3>
              <div className="mt-3 space-y-3 text-sm text-indigo-900">
                <div>
                  <p className="font-medium text-indigo-800">
                    Auth callback URL
                  </p>
                  <code className="mt-1 block break-all rounded-md bg-indigo-100 px-2 py-1 text-xs font-mono">
                    {callback.authCallback}
                  </code>
                </div>
                <div>
                  <p className="font-medium text-indigo-800">
                    Calendar sync callback URL
                  </p>
                  <code className="mt-1 block break-all rounded-md bg-indigo-100 px-2 py-1 text-xs font-mono">
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
