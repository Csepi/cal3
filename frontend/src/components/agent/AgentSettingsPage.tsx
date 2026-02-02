import { useEffect, useMemo, useState } from "react";
import { agentService } from "../../services/agentService";
import { BASE_URL } from "../../config/apiConfig";
import { AgentActionKey } from "../../types/agent";
import type {
  AgentActionDefinition,
  AgentCatalogResponse,
  AgentDetail,
  AgentKey,
  AgentPermission,
  AgentPermissionUpdate,
  AgentSummary,
  AgentStatus,
} from "../../types/agent";
import { useScreenSize } from "../../hooks/useScreenSize";
import { getThemeConfig } from "../../constants/theme";

type PermissionDraft = {
  enabled: boolean;
  scope: number[];
};

interface AgentSettingsPageProps {
  themeColor?: string;
}

const hexToRgba = (hex: string, alpha: number): string => {
  const sanitized = hex.replace('#', '');
  const normalized =
    sanitized.length === 3
      ? sanitized
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : sanitized.padEnd(6, '0').slice(0, 6);
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const CATEGORY_ORDER: AgentActionDefinition['category'][] = ['calendars', 'tasks', 'automation', 'profile'];

const RISK_BADGE: Record<'read' | 'write' | 'execute', string> = {
  read: 'bg-sky-100 text-sky-700',
  write: 'bg-amber-100 text-amber-700',
  execute: 'bg-rose-100 text-rose-700',
};

const STATUS_BADGE: Record<AgentStatus, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  disabled: 'bg-slate-200 text-slate-600',
};

const LEGACY_CALENDAR_MANAGE_KEY = 'calendar.events.manage';

function normalizeActionKeys(keys: (AgentActionKey | string)[] | undefined | null): AgentActionKey[] {
  if (!Array.isArray(keys)) {
    return [];
  }

  return keys.flatMap((key) => {
    if (key === LEGACY_CALENDAR_MANAGE_KEY) {
      return [
        AgentActionKey.CALENDAR_EVENTS_CREATE,
        AgentActionKey.CALENDAR_EVENTS_UPDATE,
        AgentActionKey.CALENDAR_EVENTS_DELETE,
      ];
    }

    return [key as AgentActionKey];
  });
}

function expandLegacyPermission(permission: AgentPermission) {
  const key = (permission.actionKey as unknown as string) ?? '';
  if (key !== LEGACY_CALENDAR_MANAGE_KEY) {
    return [permission];
  }

  const baseId = permission.id ?? 0;
  return [
    { ...permission, id: baseId, actionKey: AgentActionKey.CALENDAR_EVENTS_CREATE },
    { ...permission, id: baseId ? baseId + 1000 : baseId + 1, actionKey: AgentActionKey.CALENDAR_EVENTS_UPDATE },
    { ...permission, id: baseId ? baseId + 2000 : baseId + 2, actionKey: AgentActionKey.CALENDAR_EVENTS_DELETE },
  ];
}

function normalizeAgentSummary(agent: AgentSummary): AgentSummary {
  return {
    ...agent,
    actionKeys: normalizeActionKeys(agent.actionKeys as (AgentActionKey | string)[]),
  };
}

function normalizeAgentDetail(detail: AgentDetail): AgentDetail {
  const expandedPermissions = (detail.permissions ?? []).flatMap(expandLegacyPermission);

  return {
    ...detail,
    actionKeys: normalizeActionKeys(detail.actionKeys as (AgentActionKey | string)[]),
    permissions: expandedPermissions as AgentPermission[],
  };
}

function expandLegacyCalendarAction(action: AgentActionDefinition): AgentActionDefinition[] {
  const key = (action.key as unknown as string) ?? '';
  if (key !== LEGACY_CALENDAR_MANAGE_KEY) {
    return [action];
  }

  const scopeConfig = action.scopeConfig ?? {
    type: 'calendar',
    label: 'Calendars',
    required: true,
    allowsMultiple: true,
  };

  return [
    {
      ...action,
      key: AgentActionKey.CALENDAR_EVENTS_CREATE,
      label: 'Create Calendar Events',
      description: 'Allow the agent to create new events in the calendars you select.',
      scopeConfig: {
        ...scopeConfig,
        label: 'Calendars where the agent may create events',
        emptyHint:
          scopeConfig.emptyHint ??
          'Grant create access only to calendars you trust the agent to populate.',
      },
    },
    {
      ...action,
      key: AgentActionKey.CALENDAR_EVENTS_UPDATE,
      label: 'Update Calendar Events',
      description: 'Allow the agent to make changes to existing events in selected calendars.',
      scopeConfig: {
        ...scopeConfig,
        label: 'Calendars where the agent may update events',
        emptyHint:
          scopeConfig.emptyHint ??
          'Choose calendars whose events the agent may modify after they are created.',
      },
    },
    {
      ...action,
      key: AgentActionKey.CALENDAR_EVENTS_DELETE,
      label: 'Delete Calendar Events',
      description: 'Allow the agent to delete events from the calendars you share.',
      scopeConfig: {
        ...scopeConfig,
        label: 'Calendars where the agent may delete events',
        emptyHint:
          scopeConfig.emptyHint ??
          'Only include calendars where you are comfortable with the agent removing events.',
      },
    },
  ];
}

function normalizeCatalogResponse(catalog: AgentCatalogResponse): AgentCatalogResponse {
  const actions = (catalog.actions ?? []).flatMap(expandLegacyCalendarAction);
  return { ...catalog, actions };
}

function formatDate(value?: string | null) {
  if (!value) {
    return '-';
  }

  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function buildPermissionsDraft(
  detail: AgentDetail,
  actions: AgentActionDefinition[],
): Record<AgentActionKey, PermissionDraft> {
  const map = new Map(detail.permissions.map((permission) => [permission.actionKey, permission]));
  const result: Record<AgentActionKey, PermissionDraft> = {} as Record<AgentActionKey, PermissionDraft>;

  actions.forEach((action) => {
    const permission = map.get(action.key);
    let scope: number[] = [];

    if (permission?.scope) {
      if (action.scopeConfig?.type === 'calendar') {
        scope = (permission.scope.calendarIds ?? []).map(Number);
      } else if (action.scopeConfig?.type === 'automation-rule') {
        scope = (permission.scope.ruleIds ?? []).map(Number);
      }
    }

    result[action.key] = {
      enabled: Boolean(permission),
      scope,
    };
  });

  return result;
}

function getMcpServerKey(name: string | undefined) {
  if (!name) {
    return 'primecal-agent';
  }

  const sanitized = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return sanitized || 'primecal-agent';
}

const AgentSettingsPage: React.FC<AgentSettingsPageProps> = ({ themeColor = "#3b82f6" }) => {
  // Windows needs a shell wrapper so paths with spaces (e.g. Program Files) resolve correctly.
  const isWindows = typeof navigator !== 'undefined' && /windows/i.test(navigator.userAgent);
  const { isMobile } = useScreenSize();
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentDetail | null>(null);
  const [catalog, setCatalog] = useState<AgentCatalogResponse | null>(null);
  const [permissionsDraft, setPermissionsDraft] = useState<Record<AgentActionKey, PermissionDraft>>({});
  const [keys, setKeys] = useState<AgentKey[]>([]);
  const [keysLoading, setKeysLoading] = useState(false);

  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null);

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const theme = useMemo(() => getThemeConfig(themeColor), [themeColor]);
  const gradientBackground = `bg-gradient-to-br ${theme.gradient.background}`;
  const borderTint = hexToRgba(themeColor, 0.2);
  const accentTint = hexToRgba(themeColor, 0.12);
  const glassCardClass = 'rounded-3xl border bg-white/80 shadow-xl backdrop-blur-md';
  const panelCardClass = 'rounded-2xl border bg-white/70 shadow-sm backdrop-blur-md';
  const subtleBorderStyle = { borderColor: borderTint };
  const inputClass = `mt-1 w-full rounded-lg border bg-white/90 px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 ${theme.focus}`;
  const textareaClass = `mt-1 w-full rounded-lg border bg-white/90 px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 ${theme.focus}`;
  const primaryButtonClass = `inline-flex w-full items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold text-white shadow-md transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white ${theme.button} ${theme.focus}`;
  const accentChipStyle = {
    color: themeColor,
    backgroundColor: accentTint,
    border: `1px solid ${borderTint}`,
  };
  const checkboxAccentStyle = { accentColor: themeColor };
  const backgroundLayers = !isMobile ? (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -top-44 -right-40 h-80 w-80 animate-pulse rounded-full blur-3xl opacity-30"
        style={{ background: `radial-gradient(circle, ${hexToRgba(themeColor, 0.35)} 0%, transparent 70%)` }}
      />
      <div
        className="absolute -bottom-48 -left-36 h-80 w-80 animate-pulse rounded-full blur-3xl opacity-25 animation-delay-2000"
        style={{ background: `radial-gradient(circle, ${hexToRgba(themeColor, 0.3)} 0%, transparent 70%)` }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full blur-3xl opacity-20 animation-delay-4000"
        style={{ background: `radial-gradient(circle, ${hexToRgba(themeColor, 0.25)} 0%, transparent 75%)` }}
      />
    </div>
  ) : null;

  const [creatingAgent, setCreatingAgent] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [agentForm, setAgentForm] = useState({ name: '', description: '' });

  const isAgentDisabled = selectedAgent?.status === 'disabled';

  useEffect(() => {
    const initialise = async () => {
      try {
        setLoading(true);
        const [catalogResponse, agentList] = await Promise.all([
          agentService.getCatalog(),
          agentService.listAgents(),
        ]);

        const normalizedCatalog = normalizeCatalogResponse(catalogResponse);
        const normalizedAgents = agentList.map(normalizeAgentSummary);

        setCatalog(normalizedCatalog);
        setAgents(normalizedAgents);

        if (normalizedAgents.length > 0) {
          await selectAgent(normalizedAgents[0].id, normalizedCatalog);
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load agent settings.');
      } finally {
        setLoading(false);
      }
    };

    void initialise();
  }, []);
  useEffect(() => {
    if (selectedAgent) {
      setAgentForm({
        name: selectedAgent.name,
        description: selectedAgent.description ?? '',
      });
    }
  }, [selectedAgent]);

  useEffect(() => {
    if (!statusMessage) {
      return;
    }

    const timer = window.setTimeout(() => setStatusMessage(null), 4000);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  const groupedActions = useMemo(() => {
    if (!catalog) {
      return [];
    }

    return CATEGORY_ORDER.map((category) => ({
      category,
      actions: catalog.actions.filter((action) => action.category === category),
    })).filter((group) => group.actions.length > 0);
  }, [catalog]);

  const enabledActionKeys = useMemo(() => {
    return Object.entries(permissionsDraft)
      .filter(([, draft]) => draft.enabled)
      .map(([key]) => key as AgentActionKey);
  }, [permissionsDraft]);

  const windowsCmdPath = 'C:\\\\Windows\\\\System32\\\\cmd.exe';

  const mcpConfigSnippet = useMemo(() => {
    if (!newKeySecret) {
      return '';
    }

    const serverKey = getMcpServerKey(selectedAgent?.name);
    const authEnvKey = 'PRIMECAL_MCP_AUTH_HEADER';
    const authHeaderPlaceholder = 'Authorization:${' + authEnvKey + '}';
    const remoteUri = `${BASE_URL}/api/mcp/stream`;
    const allowHttpArgs = remoteUri.startsWith('http://') ? ['--allow-http'] : [];
    const baseArgs = [
      '-y',
      'mcp-remote',
      remoteUri,
      ...allowHttpArgs,
      '--header',
      authHeaderPlaceholder,
    ];
    const fullCommand = ['npx', ...baseArgs];
    const args = isWindows ? ['/C', fullCommand.join(' ')] : baseArgs;

    const config = {
      mcpServers: {
        [serverKey]: {
          command: isWindows ? windowsCmdPath : 'npx',
          args,
          env: {
            [authEnvKey]: `Agent ${newKeySecret}`,
          },
        },
      },
    };

    return JSON.stringify(config, null, 2);
  }, [isWindows, newKeySecret, selectedAgent?.name]);

  const selectAgent = async (agentId: number, cachedCatalog?: AgentCatalogResponse) => {
    setSelectedAgentId(agentId);
    setStatusMessage(null);
    setErrorMessage(null);
    setNewKeySecret(null);

    const definitions = (cachedCatalog || catalog)?.actions;
    if (!definitions) {
      return;
    }

    try {
      setKeysLoading(true);
      const [detail, apiKeys] = await Promise.all([
        agentService.getAgent(agentId),
        agentService.listKeys(agentId),
      ]);
      const normalizedDetail = normalizeAgentDetail(detail);
      setSelectedAgent(normalizedDetail);
      setPermissionsDraft(buildPermissionsDraft(normalizedDetail, definitions));
      setKeys(apiKeys);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load agent details.');
    } finally {
      setKeysLoading(false);
    }
  };

  const handleCreateAgent = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!agentForm.name.trim()) {
      setErrorMessage('Agent name is required.');
      return;
    }

    try {
      setCreatingAgent(true);
      const created = await agentService.createAgent({
        name: agentForm.name.trim(),
        description: agentForm.description.trim() || undefined,
      });

      const normalizedCreated = normalizeAgentSummary(created);
      setAgents((previous) => [normalizedCreated, ...previous]);
      setAgentForm({ name: '', description: '' });
      setStatusMessage(`Agent "${created.name}" created.`);
      await selectAgent(created.id);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create agent.');
    } finally {
      setCreatingAgent(false);
    }
  };

  const handleTogglePermission = (actionKey: AgentActionKey) => {
    setPermissionsDraft((previous) => {
      const draft = previous[actionKey] ?? { enabled: false, scope: [] };
      return { ...previous, [actionKey]: { ...draft, enabled: !draft.enabled } };
    });
  };

  const handleScopeToggle = (actionKey: AgentActionKey, optionId: number, allowsMultiple: boolean) => {
    setPermissionsDraft((previous) => {
      const draft = previous[actionKey] ?? { enabled: false, scope: [] };
      let scope = draft.scope;

      if (allowsMultiple) {
        scope = scope.includes(optionId)
          ? scope.filter((id) => id !== optionId)
          : [...scope, optionId];
      } else {
        scope = scope.includes(optionId) ? [] : [optionId];
      }

      return { ...previous, [actionKey]: { ...draft, scope } };
    });
  };
  const handleSavePermissions = async () => {
    if (!selectedAgent || !catalog) {
      return;
    }

    const payload: AgentPermissionUpdate[] = [];

    for (const actionKey of enabledActionKeys) {
      const definition = catalog.actions.find((action) => action.key === actionKey);
      const draft = permissionsDraft[actionKey];

      if (!definition || !draft) {
        payload.push({ actionKey, scope: null });
        continue;
      }

      if (definition.scopeConfig) {
        if (definition.scopeConfig.required && draft.scope.length === 0) {
          setErrorMessage(
            `${definition.label}: please select at least one option for "${definition.scopeConfig.label}".`,
          );
          return;
        }

        if (definition.scopeConfig.type === 'calendar') {
          payload.push({ actionKey, scope: { calendarIds: draft.scope } });
          continue;
        }

        if (definition.scopeConfig.type === 'automation-rule') {
          payload.push({ actionKey, scope: { ruleIds: draft.scope } });
          continue;
        }
      }

      payload.push({ actionKey, scope: null });
    }

    try {
      setSavingPermissions(true);
      const updated = await agentService.updatePermissions(selectedAgent.id, {
        permissions: payload,
      });

      const detail: AgentDetail = {
        ...selectedAgent,
        permissions: updated,
        actionKeys: enabledActionKeys,
      };
      const normalizedDetail = normalizeAgentDetail(detail);

      setSelectedAgent(normalizedDetail);
      setAgents((previous) =>
        previous.map((agent) =>
          agent.id === normalizedDetail.id ? { ...agent, actionKeys: normalizedDetail.actionKeys } : agent,
        ),
      );
      setStatusMessage('Agent permissions updated.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update permissions.');
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleCreateKey = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedAgent) {
      return;
    }
    if (!newKeyLabel.trim()) {
      setErrorMessage('Please provide a label for the API key.');
      return;
    }

    try {
      const created = await agentService.createKey(selectedAgent.id, newKeyLabel.trim());
      setKeys((previous) => [created.key, ...previous]);
      setNewKeyLabel('');
      setNewKeySecret(created.plaintextToken);
      setStatusMessage('New API key created. Copy it now - it will not be shown again.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create API key.');
    }
  };

  const handleRevokeKey = async (keyId: number) => {
    if (!selectedAgent) {
      return;
    }

    try {
      await agentService.revokeKey(selectedAgent.id, keyId);
      setKeys((previous) =>
        previous.map((key) =>
          key.id === keyId ? { ...key, isActive: false, revokedAt: new Date().toISOString() } : key,
        ),
      );
      setStatusMessage('API key revoked.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to revoke API key.');
    }
  };

  const handleCopySecret = async () => {
    if (!newKeySecret) {
      return;
    }

    try {
      await navigator.clipboard.writeText(newKeySecret);
      setStatusMessage('API key copied to clipboard.');
    } catch {
      setErrorMessage('Copy failed. Please copy the key manually.');
    }
  };

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedAgent) {
      return;
    }

    const trimmedName = agentForm.name.trim();
    if (!trimmedName) {
      setErrorMessage('Agent name cannot be empty.');
      return;
    }

    try {
      setSavingProfile(true);
      const updated = await agentService.updateAgent(selectedAgent.id, {
        name: trimmedName,
        description: agentForm.description.trim() || undefined,
      });

      setSelectedAgent({ ...selectedAgent, name: updated.name, description: updated.description });
      setAgents((previous) =>
        previous.map((agent) =>
          agent.id === updated.id ? { ...agent, name: updated.name, description: updated.description } : agent,
        ),
      );
      setStatusMessage('Agent profile updated.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update agent profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleToggleAgentStatus = async () => {
    if (!selectedAgent) {
      return;
    }

    try {
      if (selectedAgent.status === 'active') {
        await agentService.disableAgent(selectedAgent.id);
        setSelectedAgent({ ...selectedAgent, status: 'disabled' });
        setAgents((previous) =>
          previous.map((agent) => (agent.id === selectedAgent.id ? { ...agent, status: 'disabled' } : agent)),
        );
        setStatusMessage('Agent disabled. API keys have been revoked.');
      } else {
        const updated = await agentService.updateAgent(selectedAgent.id, { status: 'active' });
        setSelectedAgent({ ...selectedAgent, status: 'active' });
        setAgents((previous) =>
          previous.map((agent) => (agent.id === updated.id ? { ...agent, status: 'active' } : agent)),
        );
        setStatusMessage('Agent re-enabled.');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to change agent status.');
    }
  };

  const renderScopeControls = (
    action: AgentActionDefinition,
    draft: PermissionDraft,
  ) => {
    if (!catalog || !action.scopeConfig) {
      return null;
    }

    const scopeConfig = action.scopeConfig;
    const options =
      scopeConfig.type === 'calendar'
        ? catalog.resources.calendars
        : catalog.resources.automationRules;

    if (options.length === 0) {
      return (
        <p className="text-sm text-slate-500">
          {scopeConfig.emptyHint ||
            'No resources available. Configure the feature before granting agent access.'}
        </p>
      );
    }

    return (
      <div className="mt-3 space-y-2">
        <p className="text-sm font-medium text-slate-600">{scopeConfig.label}</p>
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const isSelected = draft.scope.includes(option.id);
            const isInteractive = draft.enabled && !isAgentDisabled;
            return (
              <label
              key={`scope-${action.key}-${option.id}`}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm shadow-sm transition-all duration-200 ${
                isInteractive ? 'cursor-pointer hover:-translate-y-0.5' : 'cursor-not-allowed opacity-60'
              } ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}
              style={
                isSelected
                  ? { borderColor: themeColor, backgroundColor: hexToRgba(themeColor, 0.18) }
                  : { borderColor: borderTint, backgroundColor: 'rgba(255,255,255,0.95)' }
              }
            >
              <input
                type={scopeConfig.allowsMultiple ? 'checkbox' : 'radio'}
                className="h-4 w-4"
                style={checkboxAccentStyle}
                disabled={!draft.enabled || isAgentDisabled}
                checked={isSelected}
                onChange={() => handleScopeToggle(action.key, option.id, scopeConfig.allowsMultiple)}
              />
              <span>{option.name}</span>
            </label>
            );
          })}
        </div>
        {scopeConfig.required && draft.enabled && draft.scope.length === 0 && (
          <p className="text-sm text-amber-600">Select at least one option to enable this action.</p>
        )}
      </div>
    );
  };
  if (loading) {
    return (
      <div className={`relative min-h-screen ${isMobile ? 'bg-gray-50' : gradientBackground} flex items-center justify-center p-6`}>
        {backgroundLayers}
        <div className="relative z-10 w-full max-w-3xl rounded-3xl border border-white/50 bg-white/80 p-10 shadow-xl backdrop-blur-md">
          <div className="space-y-4 animate-pulse">
            <div className="h-6 w-1/3 rounded bg-slate-200" />
            <div className="h-4 w-full rounded bg-slate-200" />
            <div className="h-4 w-5/6 rounded bg-slate-200" />
            <div className="h-64 rounded-xl bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative min-h-screen ${isMobile ? 'bg-gray-50' : gradientBackground}`}>
      {backgroundLayers}

      <header
        className={`relative z-10 border-b bg-white/70 backdrop-blur-sm ${isMobile ? 'py-4' : 'py-6'}`}
        style={{ borderColor: borderTint }}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Agent command center</p>
            <h1 className="text-3xl font-semibold" style={{ color: themeColor }}>
              Agent settings
            </h1>
            <p className="max-w-2xl text-sm text-slate-600">
              Decide which MCP agents can act on behalf of your team, what they can access, and how they authenticate.
            </p>
          </div>
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wide sm:self-start"
            style={accentChipStyle}
          >
            External LLM access
          </span>
        </div>
      </header>

      <main className={`relative z-10 mx-auto max-w-7xl ${isMobile ? 'p-4 pt-6' : 'p-6 mt-6'}`}>
        <div className="space-y-6">
          {statusMessage && (
            <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-700 shadow-sm">
              {statusMessage}
            </div>
          )}

          {errorMessage && (
            <div className="rounded-2xl border border-rose-200/70 bg-rose-50/85 px-4 py-3 text-sm text-rose-700 shadow-sm">
              {errorMessage}
            </div>
          )}

          <div className={`${glassCardClass} p-6`} style={subtleBorderStyle}>
            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
              <aside className="space-y-4">
                <div className={`${panelCardClass} p-6`} style={subtleBorderStyle}>
                  <h2 className="text-lg font-semibold text-slate-900">Agents</h2>
                  <p className="text-sm text-slate-600">
                    Create a dedicated agent profile for each tool or collaborator.
                  </p>

                  <form onSubmit={handleCreateAgent} className="mt-4 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Name
                      </label>
                      <input
                        type="text"
                        className={inputClass}
                        style={{ borderColor: borderTint }}
                        value={agentForm.name}
                        onChange={(event) =>
                          setAgentForm((previous) => ({ ...previous, name: event.target.value }))
                        }
                        placeholder="e.g. VS Code Agent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Description
                      </label>
                      <textarea
                        className={textareaClass}
                        style={{ borderColor: borderTint }}
                        rows={2}
                        value={agentForm.description}
                        onChange={(event) =>
                          setAgentForm((previous) => ({ ...previous, description: event.target.value }))
                        }
                        placeholder="How will this agent be used?"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={creatingAgent || !agentForm.name.trim()}
                      className={`${primaryButtonClass} disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {creatingAgent ? 'Creating...' : 'Create agent'}
                    </button>
                  </form>
                </div>

                <div className={`${panelCardClass} p-3`} style={subtleBorderStyle}>
                  <ul className="space-y-2">
                    {agents.map((agent) => {
                      const isActive = agent.id === selectedAgentId;
                      const actionCount = Array.isArray(agent.actionKeys) ? agent.actionKeys.length : 0;
                      const apiKeyCount = typeof agent.apiKeyCount === 'number' ? agent.apiKeyCount : 0;
                      return (
                        <li key={agent.id}>
                          <button
                            type="button"
                            onClick={() => selectAgent(agent.id)}
                            className={`w-full rounded-2xl border px-4 py-3 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white ${theme.focus} ${
                              isActive ? 'text-white shadow-lg' : 'text-slate-700 hover:-translate-y-0.5'
                            }`}
                            style={
                              isActive
                                ? {
                                    background: `linear-gradient(135deg, ${hexToRgba(themeColor, 0.85)}, ${themeColor})`,
                                    borderColor: themeColor,
                                  }
                                : {
                                    borderColor: borderTint,
                                    backgroundColor: 'rgba(255,255,255,0.9)',
                                  }
                            }
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-slate-900'}`}>
                                {agent.name}
                              </span>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[agent.status]} ${
                                  isActive ? 'bg-white/20 text-white' : ''
                                }`}
                              >
                                {agent.status === 'active' ? 'Active' : 'Disabled'}
                              </span>
                            </div>
                            {agent.description && (
                              <p className={`mt-1 line-clamp-2 text-xs ${isActive ? 'text-white/80' : 'text-slate-600'}`}>
                                {agent.description}
                              </p>
                            )}
                            <div
                              className={`mt-2 flex flex-wrap items-center gap-2 text-xs ${
                                isActive ? 'text-white/80' : 'text-slate-500'
                              }`}
                            >
                              <span>{actionCount} actions</span>
                              <span>|</span>
                              <span>{apiKeyCount} API keys</span>
                            </div>
                          </button>
                        </li>
                      );
                    })}

                    {agents.length === 0 && (
                      <li className="rounded-2xl border border-dashed border-slate-200/70 bg-white/70 px-3 py-4 text-center text-sm text-slate-600">
                        No agents yet. Create one to begin.
                      </li>
                    )}
                  </ul>
                </div>
              </aside>

              <section className="space-y-6">
                {selectedAgent ? (
                  <div className="space-y-6">
                    <section className={`${panelCardClass} p-6`} style={subtleBorderStyle}>
                      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h2 className="text-xl font-semibold text-slate-900">{selectedAgent.name}</h2>
                          <p className="text-sm text-slate-600">
                            Manage permissions and API credentials for this agent.
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span>Created {formatDate(selectedAgent.createdAt)}</span>
                            <span>|</span>
                            <span>Last used {formatDate(selectedAgent.lastUsedAt)}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleToggleAgentStatus}
                          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white ${theme.focus} ${
                            selectedAgent.status === 'active'
                              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          }`}
                        >
                          {selectedAgent.status === 'active' ? 'Disable agent' : 'Enable agent'}
                        </button>
                      </header>

                      <form onSubmit={handleSaveProfile} className="mt-6 space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                              Agent name
                            </label>
                            <input
                              type="text"
                              value={agentForm.name}
                              onChange={(event) =>
                                setAgentForm((previous) => ({ ...previous, name: event.target.value }))
                              }
                              className={inputClass}
                              style={{ borderColor: borderTint }}
                              disabled={isAgentDisabled}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                              Description
                            </label>
                            <input
                              type="text"
                              value={agentForm.description}
                              onChange={(event) =>
                                setAgentForm((previous) => ({ ...previous, description: event.target.value }))
                              }
                              className={inputClass}
                              style={{ borderColor: borderTint }}
                              disabled={isAgentDisabled}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={savingProfile || isAgentDisabled}
                            className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md transition-transform duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white ${theme.button} ${theme.focus} disabled:cursor-not-allowed disabled:opacity-60`}
                          >
                            {savingProfile ? 'Saving...' : 'Save profile'}
                          </button>
                        </div>
                      </form>
                    </section>

                    <section className={`${panelCardClass} p-6`} style={subtleBorderStyle}>
                      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">Capabilities</h3>
                          <p className="text-sm text-slate-600">
                            Choose what this agent may do and limit it to specific calendars or automations.
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          {enabledActionKeys.length} active actions
                        </span>
                      </header>

                      <div className="mt-6 space-y-8">
                        {groupedActions.map(({ category, actions }) => (
                          <div key={category} className="space-y-4">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                                {category === 'calendars'
                                  ? 'Calendars'
                                  : category === 'automation'
                                  ? 'Automation'
                                  : 'Profile'}
                              </h4>
                              <div className="h-px flex-1 bg-slate-200" />
                            </div>
                            <div className="space-y-4">
                              {actions.map((action) => {
                                const draft = permissionsDraft[action.key] ?? { enabled: false, scope: [] };
                                return (
                                  <div
                                    key={action.key}
                                    className="rounded-2xl border bg-white/85 p-4 shadow-inner transition-all duration-200 hover:-translate-y-0.5"
                                    style={{ borderColor: borderTint, backgroundColor: hexToRgba(themeColor, 0.08) }}
                                  >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                      <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                                            <input
                                              type="checkbox"
                                              className="h-4 w-4"
                                              style={checkboxAccentStyle}
                                              checked={draft.enabled}
                                              disabled={isAgentDisabled}
                                              onChange={() => handleTogglePermission(action.key)}
                                            />
                                            {action.label}
                                          </label>
                                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${RISK_BADGE[action.risk]}`}>
                                            {action.risk === 'read'
                                              ? 'Read'
                                              : action.risk === 'write'
                                              ? 'Write'
                                              : 'Execute'}
                                          </span>
                                        </div>
                                        <p className="mt-1 text-sm text-slate-600">{action.description}</p>
                                      </div>
                                      {!draft.enabled && (
                                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                                          Disabled
                                        </span>
                                      )}
                                    </div>
                                    {action.scopeConfig && renderScopeControls(action, draft)}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 flex justify-end">
                        <button
                          type="button"
                          onClick={handleSavePermissions}
                          disabled={savingPermissions || isAgentDisabled}
                          className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md transition-transform duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white ${theme.button} ${theme.focus} disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                          {savingPermissions ? 'Saving permissions...' : 'Save permissions'}
                        </button>
                      </div>
                    </section>

                    <section className={`${panelCardClass} p-6`} style={subtleBorderStyle}>
                      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">API keys</h3>
                          <p className="text-sm text-slate-600">
                            Issue a unique key for each external tool. Revoke keys immediately if they are compromised.
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          {keys.length} keys
                        </span>
                      </header>

                      {newKeySecret && (
                        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-semibold">New API key created</p>
                              <p>Copy this token now. For security reasons it will not be shown again.</p>
                            </div>
                            <button
                              type="button"
                              onClick={handleCopySecret}
                              className="inline-flex items-center justify-center rounded-md border border-amber-400 px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-300"
                            >
                              Copy API key
                            </button>
                          </div>
                          <code className="mt-3 block overflow-x-auto rounded-md bg-white px-3 py-2 text-sm text-slate-700 shadow-inner">
                            {newKeySecret}
                          </code>
                          {mcpConfigSnippet && (
                            <div className="mt-4">
                              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                                MCP configuration
                              </label>
                              <textarea
                                className={`${textareaClass} font-mono`}
                                style={{ borderColor: borderTint, backgroundColor: 'rgba(255,255,255,0.95)' }}
                                rows={Math.min(12, mcpConfigSnippet.split('\n').length + 1)}
                                value={mcpConfigSnippet}
                                readOnly
                              />
                            </div>
                          )}
                        </div>
                      )}

                      <form
                        onSubmit={handleCreateKey}
                        className="mt-4 grid gap-3 rounded-2xl border bg-white/85 p-4 shadow-inner md:grid-cols-[1fr_auto]"
                        style={{ borderColor: borderTint, backgroundColor: hexToRgba(themeColor, 0.08) }}
                      >
                        <div>
                          <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                            Key label
                          </label>
                          <input
                            type="text"
                            value={newKeyLabel}
                            onChange={(event) => setNewKeyLabel(event.target.value)}
                            className={inputClass}
                            style={{ borderColor: borderTint }}
                            placeholder="e.g. Claude Desktop"
                            disabled={isAgentDisabled}
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            type="submit"
                            disabled={isAgentDisabled}
                            className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md transition-transform duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white ${theme.button} ${theme.focus} disabled:cursor-not-allowed disabled:opacity-60 md:w-auto`}
                          >
                            Generate API key
                          </button>
                        </div>
                      </form>

                      <div className="mt-6 overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                          <thead
                            className="text-xs uppercase tracking-wide text-slate-500"
                            style={{ backgroundColor: hexToRgba(themeColor, 0.1) }}
                          >
                            <tr>
                              <th className="px-4 py-2 text-left">Label</th>
                              <th className="px-4 py-2 text-left">Last digits</th>
                              <th className="px-4 py-2 text-left">Status</th>
                              <th className="px-4 py-2 text-left">Last used</th>
                              <th className="px-4 py-2 text-left">Created</th>
                              <th className="px-4 py-2 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {keys.map((key) => (
                              <tr key={key.id} className="bg-white">
                                <td className="px-4 py-3 text-slate-800">{key.name}</td>
                                <td className="px-4 py-3 font-mono text-slate-600">...{key.lastFour}</td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                      key.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                                    }`}
                                  >
                                    {key.isActive ? 'Active' : 'Revoked'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-600">
                                  {key.isActive ? formatDate(key.lastUsedAt) : '-'}
                                </td>
                                <td className="px-4 py-3 text-slate-600">{formatDate(key.createdAt)}</td>
                                <td className="px-4 py-3 text-right">
                                  {key.isActive ? (
                                    <button
                                      type="button"
                                      onClick={() => handleRevokeKey(key.id)}
                                      className="inline-flex items-center rounded-md border border-rose-300 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-200"
                                    >
                                      Revoke
                                    </button>
                                  ) : (
                                    <span className="text-xs text-slate-400">Revoked {formatDate(key.revokedAt)}</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                            {keys.length === 0 && (
                              <tr>
                                <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={6}>
                                  {keysLoading ? 'Loading keys...' : 'No API keys issued yet.'}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  </div>
                ) : (
                  <div
                    className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed text-center text-slate-500 backdrop-blur-md"
                    style={{ borderColor: borderTint, backgroundColor: hexToRgba(themeColor, 0.08) }}
                  >
                    <p className="text-lg font-semibold text-slate-600">Select or create an agent</p>
                    <p className="mt-2 max-w-md text-sm text-slate-500">
                      Once you create an agent it will appear here so you can assign permissions and generate credentials.
                    </p>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AgentSettingsPage;





