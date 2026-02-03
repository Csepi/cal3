import { useEffect, useMemo, useState } from 'react';
import { apiService } from '../../services/api';

interface ConfigurationSetting {
  key: string;
  label: string;
  description?: string;
  valueType: 'string' | 'boolean' | 'enum' | 'secret';
  value: string | boolean | null;
  options?: string[] | null;
  isSensitive?: boolean;
}

interface ConfigurationGroup {
  key: string;
  label: string;
  description?: string;
  settings: ConfigurationSetting[];
  derived?: Record<string, unknown>;
}

type ChannelToggleMap = Record<
  string,
  { enabled: boolean; label: string; description?: string }
>;

interface ChannelDefinition {
  id: string;
  label: string;
  toggleKey?: string;
  match: (key: string) => boolean;
  description?: string;
}

interface ChannelGroupInfo {
  definition?: ChannelDefinition;
  settings: ConfigurationSetting[];
}

type ChannelGroupMap = Record<string, ChannelGroupInfo>;

const isChannelToggle = (setting: ConfigurationSetting) =>
  setting.valueType === 'boolean' && setting.key.startsWith('ENABLE_');

const CHANNEL_DEFINITIONS: ChannelDefinition[] = [
  {
    id: 'engine',
    label: 'Notification Engine',
    toggleKey: 'ENABLE_NOTIFICATIONS',
    match: (key) => key === 'REDIS_URL',
  },
  {
    id: 'rules',
    label: 'Inbox Rules',
    toggleKey: 'ENABLE_NOTIFICATION_RULES',
    match: (key) => key === 'MAX_INBOX_RULES_PER_USER',
  },
  {
    id: 'email',
    label: 'Email Channel',
    match: (key) =>
      key === 'EMAIL_PROVIDER' ||
      key.startsWith('SMTP_') ||
      key.startsWith('SENDGRID') ||
      key.startsWith('POSTMARK') ||
      key.startsWith('AWS_SES'),
  },
  {
    id: 'webpush',
    label: 'Web Push Channel',
    toggleKey: 'ENABLE_WEBPUSH',
    match: (key) => key.startsWith('WEBPUSH_'),
  },
  {
    id: 'mobile',
    label: 'Mobile Push Channel',
    toggleKey: 'ENABLE_MOBILE_PUSH',
    match: (key) => key.startsWith('FCM_'),
  },
  {
    id: 'slack',
    label: 'Slack Channel',
    toggleKey: 'ENABLE_SLACK',
    match: (key) => key.includes('SLACK'),
  },
  {
    id: 'teams',
    label: 'Microsoft Teams Channel',
    toggleKey: 'ENABLE_TEAMS',
    match: (key) => key.includes('TEAMS'),
  },
];

const FALLBACK_GROUP_ID = 'other';
const FALLBACK_GROUP_LABEL = 'General Settings';

export const AdminNotificationsPanel = ({ themeColor = '#3b82f6' }: { themeColor?: string }) => {
  const [config, setConfig] = useState<ConfigurationGroup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.getAdminNotificationConfig();
      const notificationsGroup: ConfigurationGroup | null = data?.categories?.[0] ?? null;
      setConfig(notificationsGroup);
    } catch (err) {
      console.error('Failed to load notification admin configuration', err);
      setError('Unable to load notification configuration. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleUpdate = async (setting: ConfigurationSetting, value: string | boolean | null) => {
    setSavingKey(setting.key);
    setError(null);
    try {
      await apiService.updateAdminNotificationConfig(setting.key, value);
      await loadConfig();
    } catch (err) {
      console.error('Failed to update notification config', err);
      setError('Could not save setting. Please try again.');
    } finally {
      setSavingKey(null);
    }
  };

  const renderControl = (setting: ConfigurationSetting) => {
    const disabled = savingKey === setting.key;
    const commonProps = {
      className:
        'w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 disabled:opacity-50',
      disabled,
    };

    switch (setting.valueType) {
      case 'boolean':
        return (
          <label className="inline-flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              className="rounded border-gray-300"
              checked={Boolean(setting.value === 'true' || setting.value === true)}
              onChange={(event) => handleUpdate(setting, event.target.checked)}
              disabled={disabled}
            />
            {setting.label}
          </label>
        );
      case 'enum':
        return (
          <select
            {...commonProps}
            value={String(setting.value ?? '')}
            onChange={(event) => handleUpdate(setting, event.target.value)}
          >
            {(setting.options ?? []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      default:
        return (
          <input
            type="text"
            {...commonProps}
            value={String(setting.value ?? '')}
            placeholder={setting.isSensitive ? '********' : undefined}
            onChange={(event) => handleUpdate(setting, event.target.value)}
          />
        );
    }
  };

  const derivedInfo = useMemo(() => {
    if (!config || !config.derived) {
      return [];
    }
    return Object.entries(config.derived);
  }, [config]);

  const channelMeta = useMemo<{
    toggles: ChannelToggleMap;
    groups: ChannelGroupMap;
  }>(() => {
    if (!config) {
      return { toggles: {}, groups: {} };
    }

    const toggleSettings = config.settings.filter(isChannelToggle);
    const toggles = toggleSettings.reduce<ChannelToggleMap>((acc, setting) => {
      const enabled =
        setting.value === true || setting.value === 'true' || setting.value === 'enabled';
      acc[setting.key] = {
        enabled,
        label: setting.label,
        description: setting.description,
      };
      return acc;
    }, {});

    const providerSettings = config.settings.filter((setting) => !isChannelToggle(setting));
    const groups = providerSettings.reduce<ChannelGroupMap>((acc, setting) => {
      const definition = CHANNEL_DEFINITIONS.find((def) => def.match(setting.key));
      const groupId = definition?.id ?? FALLBACK_GROUP_ID;

      if (!acc[groupId]) {
        acc[groupId] = { definition, settings: [] };
      }
      acc[groupId].settings.push(setting);
      return acc;
    }, {});

    return { toggles, groups };
  }, [config]);

  const providerGroupEntries = useMemo(
    () =>
      Object.entries(channelMeta.groups)
        .map(([id, info]) => ({
          id,
          definition: info.definition,
          settings: info.settings,
        }))
        .filter((entry) => entry.settings.length > 0)
        .sort((a, b) => {
          const orderA = a.definition
            ? CHANNEL_DEFINITIONS.findIndex((def) => def.id === a.definition?.id)
            : CHANNEL_DEFINITIONS.length + 1;
          const orderB = b.definition
            ? CHANNEL_DEFINITIONS.findIndex((def) => def.id === b.definition?.id)
            : CHANNEL_DEFINITIONS.length + 1;

          if (orderA === orderB) {
            return a.id.localeCompare(b.id);
          }
          return orderA - orderB;
        }),
    [channelMeta.groups],
  );

  return (
    <div className="space-y-6">
      <header className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-semibold text-gray-900">Notification Platform</h1>
        <p className="text-sm text-gray-500">Configure delivery channels, providers, and runtime behaviour.</p>
      </header>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {isLoading ? (
        <div className="py-12 text-center text-gray-500">Loading notification configuration...</div>
      ) : !config ? (
        <div className="py-12 text-center text-gray-500">No notification settings found.</div>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-3">Channel toggles</h2>
            <div className="grid gap-3">
              {config.settings.filter(isChannelToggle).map((setting) => (
                <div key={setting.key} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{setting.label}</p>
                    {setting.description && (
                      <p className="text-xs text-gray-500 mt-1 max-w-xl">{setting.description}</p>
                    )}
                  </div>
                  <div>{renderControl(setting)}</div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-3">Provider configuration</h2>
            <div className="space-y-5">
              {providerGroupEntries.map(({ id: groupId, definition, settings }) => {
                const toggle = definition?.toggleKey
                  ? channelMeta.toggles[definition.toggleKey]
                  : undefined;

                if (toggle && !toggle.enabled) {
                  return null;
                }

                const defaultHeading = groupId
                  .replace(/[_-]/g, ' ')
                  .toLowerCase()
                  .replace(/\b\w/g, (char) => char.toUpperCase());

                const heading = definition?.label ?? toggle?.label ?? defaultHeading ?? FALLBACK_GROUP_LABEL;

                return (
                  <div key={groupId} className="space-y-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
                        {heading}
                      </h3>
                      {(definition?.description || toggle?.description) && (
                        <p className="text-xs text-gray-500">
                          {definition?.description || toggle?.description}
                        </p>
                      )}
                    </div>
                    <div className="grid gap-4">
                      {settings.map((setting) => {
                        const isBooleanControl = setting.valueType === 'boolean';
                        return (
                          <div
                            key={setting.key}
                            className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm"
                          >
                            {!isBooleanControl && (
                              <label
                                className="block text-sm font-medium text-gray-700"
                                htmlFor={setting.key}
                              >
                                {setting.label}
                              </label>
                            )}
                            {setting.description && (
                              <p className={`text-xs text-gray-500 mb-2 ${isBooleanControl ? 'mt-0' : ''}`}>
                                {setting.description}
                              </p>
                            )}
                            {renderControl(setting)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {providerGroupEntries.length === 0 && (
                <div className="rounded-lg border border-gray-200 bg-white px-4 py-6 text-sm text-gray-500">
                  No provider configuration available for the current channel selection.
                </div>
              )}
            </div>
          </section>

          {derivedInfo.length > 0 && (
            <section>
              <h2 className="text-lg font-medium text-gray-900 mb-3">Derived information</h2>
              <div className="grid gap-2">
                {derivedInfo.map(([key, value]) => (
                  <div key={key} className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-700 mr-2">{key}:</span>
                    <span>{typeof value === 'string' ? value : JSON.stringify(value)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <footer className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
        Tip: Use feature flags to roll out channels gradually. Current accent colour{' '}
        <span className="inline-block h-3 w-3 rounded-full align-middle" style={{ backgroundColor: themeColor }} />
      </footer>
    </div>
  );
};

export default AdminNotificationsPanel;

