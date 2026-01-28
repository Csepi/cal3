import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { apiService } from '../../services/api';
import type {
  NotificationPreference,
  NotificationChannel,
  NotificationFilter,
  NotificationScopeMute,
  NotificationMessage,
  NotificationThreadSummary,
  NotificationScopeOption,
} from '../../types/Notification';

const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  inapp: 'In-app',
  email: 'Email',
  webpush: 'Web Push',
  mobilepush: 'Mobile Push',
  slack: 'Slack',
  teams: 'Teams',
};

const DIGEST_OPTIONS: Array<'immediate' | 'hourly' | 'daily'> = ['immediate', 'hourly', 'daily'];

const FILTER_SCOPE_OPTIONS: Array<{ value: 'global' | 'organisation' | 'calendar' | 'reservation'; label: string }> = [
  { value: 'global', label: 'Global (all activity)' },
  { value: 'organisation', label: 'Organisation specific' },
  { value: 'calendar', label: 'Calendar specific' },
  { value: 'reservation', label: 'Reservation specific' },
];

const SCOPE_MUTE_OPTIONS: Array<{ value: 'organisation' | 'calendar' | 'reservation'; label: string }> = [
  { value: 'organisation', label: 'Organisation' },
  { value: 'calendar', label: 'Calendar' },
  { value: 'reservation', label: 'Reservation' },
];

const CHANNEL_CHOICES: NotificationChannel[] = ['inapp', 'email', 'webpush', 'mobilepush', 'slack', 'teams'];

interface NotificationSettingsPanelProps {
  onBack: () => void;
}

interface FilterDraft {
  name: string;
  scopeType: 'global' | 'organisation' | 'calendar' | 'reservation';
  scopeId: string;
  eventTypes: string[];
  contextTypes: string[];
  markRead: boolean;
  archive: boolean;
  muteThread: boolean;
  suppressNotification: boolean;
  suppressChannels: NotificationChannel[];
  continueProcessing: boolean;
}

const DEFAULT_FILTER_DRAFT: FilterDraft = {
  name: '',
  scopeType: 'global',
  scopeId: '',
  eventTypes: [],
  contextTypes: [],
  markRead: false,
  archive: false,
  muteThread: false,
  suppressNotification: false,
  suppressChannels: [],
  continueProcessing: false,
};

export const NotificationSettingsPanel: React.FC<NotificationSettingsPanelProps> = ({ onBack }) => {
  const {
    notifications,
    threads,
    preferences,
    filters,
    catalog,
    scopeMutes,
    savePreferences,
    refreshPreferences,
    refreshFilters,
    refreshScopeMutes,
    saveFilter,
    deleteFilter,
    setScopeMute,
    removeScopeMute,
  } = useNotifications();

  const [localPreferences, setLocalPreferences] = useState<NotificationPreference[]>(preferences);
  const [saving, setSaving] = useState(false);
  const [filterSavingId, setFilterSavingId] = useState<number | null>(null);

  const [showFilterBuilder, setshowFilterBuilder] = useState(false);
  const [filterDraft, setFilterDraft] = useState<FilterDraft>(DEFAULT_FILTER_DRAFT);
  const [savingFilter, setSavingFilter] = useState(false);
  const [filterError, setFilterError] = useState<string | null>(null);

  const [muteDraft, setMuteDraft] = useState<{ scopeType: 'organisation' | 'calendar' | 'reservation'; scopeId: string }>({
    scopeType: 'calendar',
    scopeId: '',
  });
  const [savingMute, setSavingMute] = useState(false);
  const [muteError, setMuteError] = useState<string | null>(null);

  const eventDefinitions = useMemo(
    () => catalog?.eventTypes ?? [],
    [catalog],
  );

  const eventDefinitionMap = useMemo(() => {
    const map = new Map<string, typeof eventDefinitions[number]>();
    eventDefinitions.forEach((definition) => {
      map.set(definition.type, definition);
    });
    return map;
  }, [eventDefinitions]);

  const contextTypeOptions = useMemo(() => {
    const options = new Set<string>();
    threads.forEach((thread) => {
      if (thread.contextType) {
        options.add(thread.contextType);
      }
    });
    notifications.forEach((notification) => {
      const contextType =
        (notification.metadata as any)?.contextType ??
        (notification.data as any)?.contextType ??
        null;
      if (contextType) {
        options.add(String(contextType));
      }
    });
    return Array.from(options).sort((a, b) => a.localeCompare(b));
  }, [notifications, threads]);

  const getEventLabel = useCallback(
    (eventType: string) =>
      eventDefinitionMap.get(eventType)?.label ?? eventType,
    [eventDefinitionMap],
  );

  const getEventDescription = useCallback(
    (eventType: string) =>
      eventDefinitionMap.get(eventType)?.description ?? '',
    [eventDefinitionMap],
  );

  const eventTypeOptions = useMemo(() => {
    if (eventDefinitions.length > 0) {
      return eventDefinitions.map((definition) => definition.type);
    }
    const set = new Set<string>();
    preferences.forEach((pref) => set.add(pref.eventType));
    notifications.forEach((notification) => {
      if (notification.eventType) {
        set.add(notification.eventType);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [eventDefinitions, preferences, notifications]);

  const channelOptions = useMemo(
    () =>
      catalog?.channels ??
      CHANNEL_CHOICES.map((id) => ({
        id,
        label: CHANNEL_LABELS[id],
        description: '',
        supportsFallback: id !== 'inapp',
        realtime: id === 'inapp' || id === 'webpush' || id === 'mobilepush',
      })),
    [catalog],
  );

  type ScopeKey = 'organisation' | 'calendar' | 'reservation';
  type ScopeOption = NotificationScopeOption;

  const activityScopeOptions = useMemo(() => {
    const map: Record<ScopeKey, ScopeOption[]> = {
      organisation: [],
      calendar: [],
      reservation: [],
    };

    const addOption = (scope: ScopeKey, id: unknown, labelHint?: string | null) => {
      if (id === null || id === undefined) {
        return;
      }
      const value = String(id);
      if (!value) {
        return;
      }
      if (map[scope].some((option) => option.value === value)) {
        return;
      }
      const labelBase =
        labelHint && labelHint.trim().length > 0
          ? labelHint
          : `${scope.charAt(0).toUpperCase()}${scope.slice(1)} ${value}`;
      map[scope].push({
        value,
        label: labelBase,
        meta: { source: 'activity' },
      });
    };

    notifications.forEach((notification: NotificationMessage) => {
      const data = (notification.data ?? {}) as Record<string, unknown>;
      addOption('calendar', data.calendarId);
      addOption('reservation', data.reservationId);
      addOption('organisation', data.organisationId);
    });

    threads.forEach((thread: NotificationThreadSummary) => {
      if (thread.contextType === 'calendar') {
        addOption('calendar', thread.contextId);
      } else if (thread.contextType === 'reservation') {
        addOption('reservation', thread.contextId);
      } else if (thread.contextType === 'organisation') {
        addOption('organisation', thread.contextId);
      }
    });

    scopeMutes.forEach((mute) => {
      addOption(mute.scopeType, mute.scopeId);
    });

    (Object.keys(map) as ScopeKey[]).forEach((key) => {
      map[key].sort((a, b) => a.label.localeCompare(b.label));
    });

    return map;
  }, [notifications, threads, scopeMutes]);

  const [fetchedScopeOptions, setFetchedScopeOptions] = useState<Record<ScopeKey, ScopeOption[]>>({
    organisation: [],
    calendar: [],
    reservation: [],
  });
  const [scopeFetchMeta, setScopeFetchMeta] = useState<Record<ScopeKey, { loading: boolean; error: string | null }>>({
    organisation: { loading: false, error: null },
    calendar: { loading: false, error: null },
    reservation: { loading: false, error: null },
  });

  const loadScopeChoices = useCallback(async (scope: ScopeKey, force = false) => {
    if (!force && fetchedScopeOptions[scope].length > 0) {
      return;
    }
    setScopeFetchMeta((prev) => ({
      ...prev,
      [scope]: { loading: true, error: null },
    }));

    try {
      const response = await apiService.getNotificationScopeOptions(scope);
      const options: ScopeOption[] = Array.isArray(response?.[scope])
        ? response[scope].map((option) => ({
            value: option.value,
            label: option.label,
            meta: option.meta ?? null,
          }))
        : [];
      setFetchedScopeOptions((prev) => ({
        ...prev,
        [scope]: options,
      }));
      setScopeFetchMeta((prev) => ({
        ...prev,
        [scope]: { loading: false, error: null },
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to load options';
      setScopeFetchMeta((prev) => ({
        ...prev,
        [scope]: { loading: false, error: message },
      }));
    }
  }, [fetchedScopeOptions]);

  const availableScopeOptions = useMemo(() => {
    if (filterDraft.scopeType === 'global') {
      return [] as ScopeOption[];
    }
    const scope = filterDraft.scopeType as ScopeKey;
    const combined = new Map<string, ScopeOption>();
    (fetchedScopeOptions[scope] ?? []).forEach((option) => {
      combined.set(option.value, option);
    });
    (activityScopeOptions[scope] ?? []).forEach((option) => {
      if (!combined.has(option.value)) {
        combined.set(option.value, option);
      }
    });
    return Array.from(combined.values()).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [activityScopeOptions, fetchedScopeOptions, filterDraft.scopeType]);

  const scopeSelectValue = useMemo(() => {
    if (filterDraft.scopeType === 'global') {
      return '';
    }
    return availableScopeOptions.some((option) => option.value === filterDraft.scopeId)
      ? filterDraft.scopeId
      : '';
  }, [availableScopeOptions, filterDraft.scopeId, filterDraft.scopeType]);

  const selectedScopeOption = useMemo<ScopeOption | null>(() => {
    if (filterDraft.scopeType === 'global' || !filterDraft.scopeId) {
      return null;
    }
    const option = availableScopeOptions.find(
      (item) => item.value === filterDraft.scopeId,
    );
    return option ?? null;
  }, [availableScopeOptions, filterDraft.scopeId, filterDraft.scopeType]);

  const currentScopeKey = filterDraft.scopeType === 'global' ? null : (filterDraft.scopeType as ScopeKey);
  const currentScopeMeta = currentScopeKey ? scopeFetchMeta[currentScopeKey] : null;
  const handleScopeOptionsRefresh = useCallback(() => {
    if (!currentScopeKey) {
      return;
    }
    void loadScopeChoices(currentScopeKey, true);
  }, [currentScopeKey, loadScopeChoices]);

  useEffect(() => {
    refreshPreferences();
    refreshFilters();
    refreshScopeMutes();
  }, [refreshPreferences, refreshFilters, refreshScopeMutes]);

  useEffect(() => {
    if (filterDraft.scopeType === 'global') {
      return;
    }
    void loadScopeChoices(filterDraft.scopeType as ScopeKey);
  }, [filterDraft.scopeType, loadScopeChoices]);

  useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

  const getPrimaryChannel = useCallback((pref: NotificationPreference): NotificationChannel => {
    const enabledChannels = Object.entries(pref.channels)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([key]) => key as NotificationChannel);
    const fallbackOrdered = pref.fallbackOrder ?? [];
    for (const candidate of fallbackOrdered) {
      if (enabledChannels.includes(candidate as NotificationChannel)) {
        return candidate as NotificationChannel;
      }
    }
    return enabledChannels[0] ?? 'inapp';
  }, []);

  const handleChannelToggle = useCallback((eventType: string, channel: NotificationChannel) => {
    setLocalPreferences((prev) =>
      prev.map((pref) => {
        if (pref.eventType !== eventType) {
          return pref;
        }

        const toggled = !pref.channels[channel];
        const nextChannels: Record<string, boolean> = {
          ...pref.channels,
          [channel]: toggled,
        };

        const enabledChannels = Object.entries(nextChannels)
          .filter(([, enabled]) => Boolean(enabled))
          .map(([key]) => key as NotificationChannel);

        if (enabledChannels.length === 0) {
          nextChannels.inapp = true;
          enabledChannels.push('inapp');
        }

        let fallbackOrder = (pref.fallbackOrder ?? []).filter((entry) =>
          enabledChannels.includes(entry as NotificationChannel),
        );
        if (fallbackOrder.length === 0) {
          fallbackOrder = [enabledChannels[0]];
        }

        enabledChannels.forEach((candidate) => {
          if (!fallbackOrder.includes(candidate)) {
            fallbackOrder.push(candidate);
          }
        });

        return {
          ...pref,
          channels: nextChannels,
          fallbackOrder,
        };
      }),
    );
  }, []);

  const handlePrimaryChannelChange = useCallback((eventType: string, channel: NotificationChannel) => {
    setLocalPreferences((prev) =>
      prev.map((pref) => {
        if (pref.eventType !== eventType) {
          return pref;
        }

        const updatedChannels = {
          ...pref.channels,
          [channel]: true,
        };

        const remaining = (pref.fallbackOrder ?? []).filter((entry) => entry !== channel);
        const fallbackOrder: NotificationChannel[] = [channel, ...remaining];

        return {
          ...pref,
          channels: updatedChannels,
          fallbackOrder,
        };
      }),
    );
  }, []);

  const handleFallbackChannelsChange = useCallback(
    (eventType: string, selected: NotificationChannel[]) => {
      setLocalPreferences((prev) =>
        prev.map((pref) => {
          if (pref.eventType !== eventType) {
            return pref;
          }

          const primary = getPrimaryChannel(pref);
          const unique = Array.from(new Set(selected.filter((channel) => channel !== primary)));
          const updatedChannels = { ...pref.channels };
          unique.forEach((channel) => {
            updatedChannels[channel] = true;
          });

          return {
            ...pref,
            channels: updatedChannels,
            fallbackOrder: [primary, ...unique],
          };
        }),
      );
    },
    [getPrimaryChannel],
  );

  const handleDigestChange = useCallback((eventType: string, digest: 'immediate' | 'hourly' | 'daily') => {
    setLocalPreferences((prev) =>
      prev.map((pref) =>
        pref.eventType === eventType
          ? { ...pref, digest }
          : pref,
      ),
    );
  }, []);

  const handleSavePreferences = useCallback(async () => {
    setSaving(true);
    try {
      await savePreferences(localPreferences);
    } finally {
      setSaving(false);
    }
  }, [localPreferences, savePreferences]);

  const handleToggleFilter = useCallback(
    async (filter: NotificationFilter) => {
      setFilterSavingId(filter.id ?? null);
      try {
        await saveFilter({ ...filter, isEnabled: !filter.isEnabled });
        await refreshFilters();
      } finally {
        setFilterSavingId(null);
      }
    },
    [refreshFilters, saveFilter],
  );

  const handleDeleteFilter = useCallback(
    async (filterId: number) => {
      setFilterSavingId(filterId);
      try {
        await deleteFilter(filterId);
        await refreshFilters();
      } finally {
        setFilterSavingId(null);
      }
    },
    [deleteFilter, refreshFilters],
  );

  const sortedPreferences = useMemo(
    () => [...localPreferences].sort((a, b) => a.eventType.localeCompare(b.eventType)),
    [localPreferences],
  );

  const sortedFilters = useMemo(
    () =>
      filters
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.id ?? 0) - (b.id ?? 0)),
    [filters],
  );

  const handleFilterFieldChange = <T extends keyof FilterDraft>(key: T, value: FilterDraft[T]) => {
    setFilterDraft((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'scopeType' ? { scopeId: '' } : {}),
    }));
  };

  const handleEventTypeSelect = (event: ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(event.target.selectedOptions)
      .map((option) => option.value)
      .filter((value) => value);
    setFilterDraft((prev) => ({
      ...prev,
      eventTypes: values,
    }));
  };

  const handleScopeSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setFilterDraft((prev) => ({
      ...prev,
      scopeId: event.target.value,
    }));
  };

  const handleScopeInputChange = (value: string) => {
    setFilterDraft((prev) => ({
      ...prev,
      scopeId: value,
    }));
  };

  const handleContextTypeSelect = (event: ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(event.target.selectedOptions)
      .map((option) => option.value)
      .filter((value) => value);
    setFilterDraft((prev) => ({
      ...prev,
      contextTypes: values,
    }));
  };

  const handleToggleSuppressChannel = (channel: NotificationChannel) => {
    setFilterDraft((prev) => {
      const exists = prev.suppressChannels.includes(channel);
      return {
        ...prev,
        suppressChannels: exists
          ? prev.suppressChannels.filter((item) => item !== channel)
          : [...prev.suppressChannels, channel],
      };
    });
  };

  const buildFilterPayload = (): NotificationFilter | null => {
    if (!filterDraft.name.trim()) {
      setFilterError('Filter name is required.');
      return null;
    }

    if (filterDraft.scopeType !== 'global' && !filterDraft.scopeId.trim()) {
      setFilterError('Scope identifier is required for non-global filters.');
      return null;
    }

    const conditions: NotificationFilter['conditions'] = [];
    if (filterDraft.eventTypes.length === 1) {
      conditions.push({
        field: 'eventType',
        operator: 'equals',
        value: filterDraft.eventTypes[0],
      });
    } else if (filterDraft.eventTypes.length > 1) {
      conditions.push({
        field: 'eventType',
        operator: 'in',
        value: filterDraft.eventTypes,
      });
    }

    if (filterDraft.contextTypes.length === 1) {
      conditions.push({
        field: 'contextType',
        operator: 'equals',
        value: filterDraft.contextTypes[0],
      });
    } else if (filterDraft.contextTypes.length > 1) {
      conditions.push({
        field: 'contextType',
        operator: 'in',
        value: filterDraft.contextTypes,
      });
    }

    const actions: NotificationFilter['actions'] = [];
    if (filterDraft.markRead) {
      actions.push({ type: 'mark_read' });
    }
    if (filterDraft.archive) {
      actions.push({ type: 'archive' });
    }
    if (filterDraft.muteThread) {
      actions.push({ type: 'mute_thread' });
    }
    if (filterDraft.suppressNotification) {
      actions.push({ type: 'suppress_notification' });
    } else if (filterDraft.suppressChannels.length > 0) {
      actions.push({
        type: 'suppress_channels',
        payload: { channels: filterDraft.suppressChannels },
      });
    }

    if (actions.length === 0) {
      setFilterError('Select at least one action.');
      return null;
    }

    setFilterError(null);
    return {
      id: undefined,
      name: filterDraft.name.trim(),
      scopeType: filterDraft.scopeType,
      scopeId: filterDraft.scopeType === 'global' ? undefined : filterDraft.scopeId.trim(),
      isEnabled: true,
      conditions,
      actions,
      continueProcessing: filterDraft.continueProcessing,
    };
  };

  const handleCreateFilter = async () => {
    const payload = buildFilterPayload();
    if (!payload) {
      return;
    }
    setSavingFilter(true);
    try {
      await saveFilter(payload);
      await refreshFilters();
      setshowFilterBuilder(false);
      setFilterDraft(DEFAULT_FILTER_DRAFT);
    } finally {
      setSavingFilter(false);
    }
  };

  const handleAddMute = async () => {
    if (!muteDraft.scopeId.trim()) {
      setMuteError('Provide an identifier to mute.');
      return;
    }
    setMuteError(null);
    setSavingMute(true);
    try {
      await setScopeMute(muteDraft.scopeType, muteDraft.scopeId.trim(), true);
      await refreshScopeMutes();
      setMuteDraft((prev) => ({ ...prev, scopeId: '' }));
    } finally {
      setSavingMute(false);
    }
  };

  const handleRemoveMute = async (mute: NotificationScopeMute) => {
    setSavingMute(true);
    try {
      await removeScopeMute(mute.scopeType, mute.scopeId);
      await refreshScopeMutes();
    } finally {
      setSavingMute(false);
    }
  };

  const renderChannelToggle = (pref: NotificationPreference, channel: NotificationChannel) => (
    <label key={channel} className="inline-flex items-center gap-2 text-sm text-gray-600">
      <input
        type="checkbox"
        className="rounded border-gray-300"
        checked={!!pref.channels[channel]}
        onChange={() => handleChannelToggle(pref.eventType, channel)}
      />
      {CHANNEL_LABELS[channel]}
    </label>
  );

  const renderFilterActions = (filter: NotificationFilter) => {
    const friendly: string[] = [];
    filter.actions.forEach((action) => {
      switch (action.type) {
        case 'mark_read':
          friendly.push('Mark as read');
          break;
        case 'archive':
          friendly.push('Archive notification');
          break;
        case 'mute_thread':
          friendly.push('Mute thread');
          break;
        case 'suppress_notification':
          friendly.push('Suppress notification entirely');
          break;
        case 'suppress_channels':
          friendly.push(
            `Suppress: ${(action.payload?.channels ?? []).map((channel: string) => CHANNEL_LABELS[channel as NotificationChannel] ?? channel).join(', ')}`,
          );
          break;
        default:
          friendly.push(action.type);
      }
    });
    return friendly;
  };

  const renderFilterConditions = (filter: NotificationFilter) => {
    if (!Array.isArray(filter.conditions) || filter.conditions.length === 0) {
      return ['Always'];
    }
    return filter.conditions.map((condition) => {
      const value = condition.value ?? '';
      if (condition.field === 'eventType') {
        if (Array.isArray(value)) {
          const labels = value.map((item) => getEventLabel(String(item))).join(', ');
          return condition.operator === 'in'
            ? `Event type is any of ${labels}`
            : `Event type ${condition.operator} ${labels}`;
        }
        return condition.operator === 'equals'
          ? `Event type is ${getEventLabel(String(value))}`
          : `Event type ${condition.operator} ${getEventLabel(String(value))}`;
      }
      if (condition.field === 'contextType') {
        if (Array.isArray(value)) {
          const labels = value.map((item) => String(item)).join(', ');
          return condition.operator === 'in'
            ? `Context is any of ${labels}`
            : `Context ${condition.operator} ${labels}`;
        }
        return condition.operator === 'equals'
          ? `Context is ${String(value)}`
          : `Context ${condition.operator} ${String(value)}`;
      }
      return `${condition.field} ${condition.operator} ${String(value)}`;
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Notification Settings</h1>
          <p className="text-sm text-gray-500">
            Customise how you receive updates, automate inbox clean-up, and manage muted scopes.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleSavePreferences}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Per-event channel preferences</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Event Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Channels</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Primary Channel</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Fallback Channels</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Digest</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {sortedPreferences.map((pref) => {
                const primaryChannel = getPrimaryChannel(pref);
                const fallbackChannelsSelected = (pref.fallbackOrder ?? []).filter(
                  (channel) => channel !== primaryChannel && pref.channels[channel],
                );
                const fallbackChoices = channelOptions
                  .map((option) => option.id as NotificationChannel)
                  .filter((channelId) => channelId !== primaryChannel && pref.channels[channelId]);

                return (
                  <tr key={pref.eventType}>
                  <td className="px-4 py-3 align-top">
                    <div className="text-sm font-medium text-gray-900">{getEventLabel(pref.eventType)}</div>
                    <p className="text-xs text-gray-500">
                      {pref.eventType}
                      {getEventDescription(pref.eventType) ? ` - ${getEventDescription(pref.eventType)}` : ''}
                    </p>
                    {eventDefinitionMap.get(pref.eventType)?.recommendedChannels?.length ? (
                      <p className="text-xs text-blue-600 mt-1">
                        Recommended channels:{' '}
                        {eventDefinitionMap
                          .get(pref.eventType)!
                          .recommendedChannels.map((channel) => CHANNEL_LABELS[channel])
                          .join(', ')}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-3">
                      {CHANNEL_CHOICES.map((channel) => renderChannelToggle(pref, channel))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={primaryChannel}
                      onChange={(event) =>
                        handlePrimaryChannelChange(pref.eventType, event.target.value as NotificationChannel)
                      }
                      className="rounded-md border border-gray-300 py-1.5 px-3 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                    >
                      {channelOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      multiple
                      value={fallbackChannelsSelected}
                      onChange={(event) =>
                        handleFallbackChannelsChange(
                          pref.eventType,
                          Array.from(event.target.selectedOptions).map((option) => option.value as NotificationChannel),
                        )
                      }
                      size={Math.max(1, Math.min(Math.max(fallbackChoices.length, 3), 6))}
                      className="w-full rounded-md border border-gray-300 py-1.5 px-3 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                    >
                      {fallbackChoices.map((channel) => (
                        <option key={channel} value={channel}>
                          {CHANNEL_LABELS[channel]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={pref.digest ?? 'immediate'}
                      onChange={(event) =>
                        handleDigestChange(pref.eventType, event.target.value as 'immediate' | 'hourly' | 'daily')
                      }
                      className="rounded-md border border-gray-300 py-1.5 px-3 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                    >
                        {DIGEST_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Inbox filters</h2>
            <p className="text-sm text-gray-500">
              Automatically archive, mute, or suppress notifications that match specific criteria.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setFilterDraft(DEFAULT_FILTER_DRAFT);
              setFilterError(null);
              setshowFilterBuilder(true);
            }}
            className="px-4 py-2 rounded-lg border border-blue-500 text-blue-600 hover:bg-blue-50"
          >
            New filter
          </button>
        </div>

        {showFilterBuilder && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-blue-900">Create filter</h3>
                <p className="text-xs text-blue-700">
                  Define the scope, triggers, and actions. Filters run in order and can continue to the next filter.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setshowFilterBuilder(false);
                  setFilterError(null);
                }}
                className="text-sm text-blue-700 hover:text-blue-900"
              >
                Cancel
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-gray-700">Filter name</span>
                <input
                  type="text"
                  value={filterDraft.name}
                  onChange={(event) => handleFilterFieldChange('name', event.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
                  placeholder="e.g. Calendar reminders digest"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-gray-700">Scope</span>
                <select
                  value={filterDraft.scopeType}
                  onChange={(event) =>
                    handleFilterFieldChange('scopeType', event.target.value as FilterDraft['scopeType'])
                  }
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
                >
                  {FILTER_SCOPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              {filterDraft.scopeType !== 'global' && (
                <div className="flex flex-col gap-2 text-sm">
                  <span className="font-medium text-gray-700">Scope identifier</span>
                  <select
                    value={scopeSelectValue}
                    onChange={handleScopeSelectChange}
                    className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
                  >
                    <option value="">
                      {availableScopeOptions.length > 0
                        ? `Select from available ${filterDraft.scopeType} entries`
                        : `No ${filterDraft.scopeType} found yet`}
                    </option>
                    {availableScopeOptions.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                        title={
                          Array.isArray((option.meta as any)?.tags) && (option.meta as any).tags.length > 0
                            ? (option.meta as any).tags.join(', ')
                            : undefined
                        }
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {selectedScopeOption &&
                    Array.isArray(selectedScopeOption.meta?.tags) &&
                    selectedScopeOption.meta?.tags.length > 0 && (
                      <p className="mt-1 text-xs text-gray-500">
                        {selectedScopeOption.meta?.tags.join(', ')}
                      </p>
                    )}
                  {selectedScopeOption && selectedScopeOption.meta?.organisationName && (
                    <p className="mt-1 text-xs text-gray-500">
                      Organisation: {selectedScopeOption.meta.organisationName}
                    </p>
                  )}
                  {currentScopeMeta?.loading && (
                    <p className="text-xs text-gray-500">
                      Loading {filterDraft.scopeType} options...
                    </p>
                  )}
                  {currentScopeMeta?.error && (
                    <p className="text-xs text-red-500">
                      {currentScopeMeta.error}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleScopeOptionsRefresh}
                      disabled={currentScopeMeta?.loading}
                      className="self-start text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
                    >
                      Refresh list
                    </button>
                  </div>
                  <input
                    type="text"
                    value={filterDraft.scopeId}
                    onChange={(event) => handleScopeInputChange(event.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
                    placeholder="Or enter a custom ID"
                  />
                  <p className="text-xs text-gray-500">
                    Pick a value from the dropdown or supply a custom identifier for this scope. Use refresh if new items were added elsewhere.
                  </p>
                </div>
              )}

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-gray-700">Event types (optional)</span>
                <select
                  multiple
                  value={filterDraft.eventTypes}
                  onChange={handleEventTypeSelect}
                  disabled={eventTypeOptions.length === 0}
                  size={Math.min(Math.max(eventTypeOptions.length, 4), 8)}
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
                >
                  {eventTypeOptions.map((type) => (
                    <option key={type} value={type} title={getEventDescription(type)}>
                      {getEventLabel(type)}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">
                  Leave empty to match any event type. Hold Ctrl/Cmd to select multiple.
                </p>
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-gray-700">Context types (optional)</span>
                <select
                  multiple
                  value={filterDraft.contextTypes}
                  onChange={handleContextTypeSelect}
                  disabled={contextTypeOptions.length === 0}
                  size={Math.min(Math.max(contextTypeOptions.length, 4), 8)}
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
                >
                  {contextTypeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">
                  Leave empty to match any context. Hold Ctrl/Cmd to select multiple.
                </p>
              </label>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-700">Actions</span>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={filterDraft.markRead}
                    onChange={(event) => handleFilterFieldChange('markRead', event.target.checked)}
                  />
                  Mark matching notifications as read
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={filterDraft.archive}
                    onChange={(event) => handleFilterFieldChange('archive', event.target.checked)}
                  />
                  Archive matching notifications
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={filterDraft.muteThread}
                    onChange={(event) => handleFilterFieldChange('muteThread', event.target.checked)}
                  />
                  Mute thread automatically
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={filterDraft.suppressNotification}
                    onChange={(event) => handleFilterFieldChange('suppressNotification', event.target.checked)}
                  />
                  Suppress notification entirely
                </label>
              </div>
            </div>

            {!filterDraft.suppressNotification && (
              <div>
                <span className="text-sm font-medium text-gray-700">Channels to suppress</span>
                <div className="mt-2 flex flex-wrap gap-3">
                  {CHANNEL_CHOICES.map((channel) => (
                    <label key={channel} className="inline-flex items-center gap-2 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={filterDraft.suppressChannels.includes(channel)}
                        onChange={() => handleToggleSuppressChannel(channel)}
                      />
                      {CHANNEL_LABELS[channel]}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <label className="inline-flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={filterDraft.continueProcessing}
                onChange={(event) => handleFilterFieldChange('continueProcessing', event.target.checked)}
              />
              Continue evaluating subsequent filters after this one
            </label>

            {filterError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {filterError}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setshowFilterBuilder(false);
                  setFilterError(null);
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateFilter}
                disabled={savingFilter}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {savingFilter ? 'Saving filter...' : 'Save filter'}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {sortedFilters.length === 0 ? (
            <div className="border border-dashed border-gray-300 rounded-lg p-6 text-sm text-gray-500 text-center">
              No inbox filters yet. Use the "New filter" button to automate clean-up.
            </div>
          ) : (
            sortedFilters.map((filter) => (
              <div key={filter.id ?? filter.name} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{filter.name}</h3>
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Scope: {filter.scopeType}
                      {filter.scopeId ? ` - ${filter.scopeId}` : ''}
                    </p>
                    {filter.conditions.some((condition) => condition.field === 'eventType') && (
                      <p className="text-xs text-gray-500 mt-1">
                        {filter.conditions
                          .filter((condition) => condition.field === 'eventType')
                          .map((condition) => {
                            if (Array.isArray(condition.value)) {
                              return condition.value
                                .map((value) => getEventLabel(String(value)))
                                .join(', ');
                            }
                            return getEventLabel(String(condition.value ?? ''));
                          })
                          .join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleFilter(filter)}
                      disabled={filterSavingId === (filter.id ?? null)}
                      className={`px-3 py-1.5 rounded-lg text-sm border ${
                        filter.isEnabled
                          ? 'border-green-500 text-green-600 hover:bg-green-50'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {filter.isEnabled ? 'Disable' : 'Enable'}
                    </button>
                    {filter.id && (
                      <button
                        type="button"
                        onClick={() => handleDeleteFilter(filter.id!)}
                        disabled={filterSavingId === filter.id}
                        className="px-3 py-1.5 rounded-lg text-sm border border-red-400 text-red-500 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-3 grid gap-3 text-sm text-gray-600 md:grid-cols-2">
                  <div>
                    <p className="font-medium text-gray-500 uppercase text-xs tracking-wide">Conditions</p>
                    <ul className="mt-1 list-disc list-inside space-y-1">
                      {renderFilterConditions(filter).map((condition, index) => (
                        <li key={`${filter.id}-cond-${index}`}>{condition}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-gray-500 uppercase text-xs tracking-wide">Actions</p>
                    <ul className="mt-1 list-disc list-inside space-y-1">
                      {renderFilterActions(filter).map((action, index) => (
                        <li key={`${filter.id}-action-${index}`}>{action}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Muted scopes</h2>
            <p className="text-sm text-gray-500">
              Mute entire calendars, reservations, or organisations to keep your inbox focused.
            </p>
          </div>
        </div>

        {scopeMutes.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-lg p-6 text-sm text-gray-500 text-center">
            Nothing muted yet. Add a scope below to silence notifications in bulk.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {scopeMutes.map((mute) => (
              <div key={`${mute.scopeType}-${mute.scopeId}`} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {mute.scopeType.charAt(0).toUpperCase() + mute.scopeType.slice(1)} {mute.scopeId}
                  </p>
                  {mute.updatedAt && (
                    <p className="text-xs text-gray-500">
                      Muted {new Date(mute.updatedAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveMute(mute)}
                  disabled={savingMute}
                  className="px-3 py-1.5 rounded-lg text-sm border border-gray-300 text-gray-600 hover:bg-gray-100"
                >
                  Unmute
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Add mute</h3>
          <div className="grid gap-4 md:grid-cols-[200px_1fr]">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">Scope type</span>
              <select
                value={muteDraft.scopeType}
                onChange={(event) =>
                  setMuteDraft((prev) => ({
                    ...prev,
                    scopeType: event.target.value as typeof muteDraft.scopeType,
                  }))
                }
                className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
              >
                {SCOPE_MUTE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">Identifier</span>
              <input
                type="text"
                value={muteDraft.scopeId}
                onChange={(event) =>
                  setMuteDraft((prev) => ({ ...prev, scopeId: event.target.value }))
                }
                className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
                placeholder="Enter the ID to mute (e.g. calendar ID)"
              />
            </label>
          </div>

          {muteError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {muteError}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAddMute}
              disabled={savingMute}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {savingMute ? 'Adding...' : 'Add mute'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default NotificationSettingsPanel;


