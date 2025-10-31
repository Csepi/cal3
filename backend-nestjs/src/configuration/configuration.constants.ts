import type { ConfigurationValueType } from '../entities/configuration-setting.entity';

export interface ConfigurationDefinition {
  key: string;
  label: string;
  description?: string;
  category: ConfigurationCategoryKey;
  valueType: ConfigurationValueType;
  defaultValue?: string;
  isSensitive?: boolean;
  isEditable?: boolean;
  isReadOnly?: boolean;
  options?: string[];
  metadata?: Record<string, any>;
}

export type ConfigurationCategoryKey =
  | 'environment'
  | 'oauth'
  | 'feature-flags';

export const CONFIGURATION_CATEGORY_METADATA: Record<
  ConfigurationCategoryKey,
  { label: string; description?: string }
> = {
  environment: {
    label: 'Runtime Environment',
    description:
      'Controls non-destructive runtime configuration that can be safely changed without redeploying infrastructure.',
  },
  oauth: {
    label: 'Identity & OAuth Providers',
    description:
      'Manage the client credentials that allow Google and Microsoft sign-in integrations.',
  },
  'feature-flags': {
    label: 'Feature Flags',
    description:
      'Toggle application capabilities without deploying code. Disabled features are hidden from the user interface.',
  },
};

export const CONFIGURATION_DEFINITIONS: ConfigurationDefinition[] = [
  {
    key: 'NODE_ENV',
    label: 'Node Environment',
    description:
      'Logical environment reported to the application (development, staging, production, test). Changing this value updates configuration-dependent behaviour; restart the containers to apply everywhere.',
    category: 'environment',
    valueType: 'enum',
    options: ['development', 'staging', 'production', 'test'],
    defaultValue: process.env.NODE_ENV ?? 'development',
    isSensitive: false,
    isEditable: true,
    metadata: {
      requiresRestart: true,
    },
  },
  {
    key: 'GOOGLE_CLIENT_ID',
    label: 'Google Client ID',
    description:
      'Public identifier for your Google OAuth application. Required for Google sign-in and calendar sync.',
    category: 'oauth',
    valueType: 'string',
    defaultValue: process.env.GOOGLE_CLIENT_ID ?? '',
  },
  {
    key: 'GOOGLE_CLIENT_SECRET',
    label: 'Google Client Secret',
    description:
      'Confidential secret issued by Google for OAuth flows. Displayed as masked value in the admin console.',
    category: 'oauth',
    valueType: 'secret',
    defaultValue: process.env.GOOGLE_CLIENT_SECRET ?? '',
    isSensitive: true,
  },
  {
    key: 'MICROSOFT_CLIENT_ID',
    label: 'Microsoft Client ID',
    description:
      'Public identifier for your Microsoft Azure AD application. Required for Microsoft sign-in and calendar sync.',
    category: 'oauth',
    valueType: 'string',
    defaultValue: process.env.MICROSOFT_CLIENT_ID ?? '',
  },
  {
    key: 'MICROSOFT_CLIENT_SECRET',
    label: 'Microsoft Client Secret',
    description:
      'Confidential secret issued by Microsoft for OAuth flows. Displayed as masked value in the admin console.',
    category: 'oauth',
    valueType: 'secret',
    defaultValue: process.env.MICROSOFT_CLIENT_SECRET ?? '',
    isSensitive: true,
  },
  {
    key: 'MICROSOFT_TENANT_ID',
    label: 'Microsoft Tenant ID',
    description:
      'Tenant identifier used for Microsoft login. Use "common" for multi-tenant applications.',
    category: 'oauth',
    valueType: 'string',
    defaultValue: process.env.MICROSOFT_TENANT_ID ?? 'common',
  },
  {
    key: 'ENABLE_OAUTH',
    label: 'Enable OAuth Sign-in',
    description:
      'Control whether Google and Microsoft single sign-on is presented to end users.',
    category: 'feature-flags',
    valueType: 'boolean',
    defaultValue: process.env.ENABLE_OAUTH ?? 'true',
  },
  {
    key: 'ENABLE_CALENDAR_SYNC',
    label: 'Enable Calendar Sync',
    description:
      'Allows users to sync external calendars and import meetings from Google or Microsoft.',
    category: 'feature-flags',
    valueType: 'boolean',
    defaultValue: process.env.ENABLE_CALENDAR_SYNC ?? 'true',
  },
  {
    key: 'ENABLE_RESERVATIONS',
    label: 'Enable Reservations Module',
    description:
      'Toggle visibility of resource reservation workflows in the UI.',
    category: 'feature-flags',
    valueType: 'boolean',
    defaultValue: process.env.ENABLE_RESERVATIONS ?? 'true',
  },
  {
    key: 'ENABLE_AUTOMATION',
    label: 'Enable Automation Rules',
    description:
      'Enable or disable automation rule execution and configuration.',
    category: 'feature-flags',
    valueType: 'boolean',
    defaultValue: process.env.ENABLE_AUTOMATION ?? 'true',
  },
  {
    key: 'ENABLE_AGENT_INTEGRATIONS',
    label: 'Enable Agent Integrations',
    description:
      'Controls access to MCP agent integrations and related UI elements.',
    category: 'feature-flags',
    valueType: 'boolean',
    defaultValue: process.env.ENABLE_AGENT_INTEGRATIONS ?? 'false',
  },
];
