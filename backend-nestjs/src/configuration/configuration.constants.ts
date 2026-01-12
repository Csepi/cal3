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
  | 'feature-flags'
  | 'notifications';

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
  notifications: {
    label: 'Notification Platform',
    description:
      'Configure notification channels, provider credentials, and runtime policies for the messaging pipeline.',
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
    key: 'CALENDAR_SYNC_LOOKBACK_DAYS',
    label: 'Calendar Sync Lookback (Days)',
    description:
      'How many days in the past to import when syncing external calendars.',
    category: 'environment',
    valueType: 'string',
    defaultValue: process.env.CALENDAR_SYNC_LOOKBACK_DAYS ?? '90',
  },
  {
    key: 'CALENDAR_SYNC_LOOKAHEAD_DAYS',
    label: 'Calendar Sync Lookahead (Days)',
    description:
      'How many days into the future to import when syncing external calendars.',
    category: 'environment',
    valueType: 'string',
    defaultValue: process.env.CALENDAR_SYNC_LOOKAHEAD_DAYS ?? '365',
  },
  {
    key: 'CALENDAR_SYNC_POLL_INTERVAL_MINUTES',
    label: 'Calendar Sync Poll Interval (Minutes)',
    description:
      'How often the background sync checks connected calendars for updates.',
    category: 'environment',
    valueType: 'string',
    defaultValue: process.env.CALENDAR_SYNC_POLL_INTERVAL_MINUTES ?? '5',
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
  {
    key: 'ENABLE_TASKS',
    label: 'Enable Tasks',
    description:
      'Toggle the Tasks workspace, APIs, and navigation entry points across the platform.',
    category: 'feature-flags',
    valueType: 'boolean',
    defaultValue: process.env.ENABLE_TASKS ?? 'true',
  },
  {
    key: 'ENABLE_NOTIFICATIONS',
    label: 'Enable Notification Engine',
    description:
      'Master toggle for notification processing. Disable to stop queue dispatch while retaining in-app records.',
    category: 'notifications',
    valueType: 'boolean',
    defaultValue: process.env.ENABLE_NOTIFICATIONS ?? 'true',
  },
  {
    key: 'ENABLE_NOTIFICATION_RULES',
    label: 'Enable Inbox Rules',
    description:
      'Allow users to define inbox rules for auto-archiving, muting, or overriding notification channels.',
    category: 'notifications',
    valueType: 'boolean',
    defaultValue: process.env.ENABLE_NOTIFICATION_RULES ?? 'true',
  },
  {
    key: 'MAX_INBOX_RULES_PER_USER',
    label: 'Max Inbox Rules Per User',
    description:
      'Upper limit of inbox rules a user may configure. Prevents runaway rule creation.',
    category: 'notifications',
    valueType: 'string',
    defaultValue: process.env.MAX_INBOX_RULES_PER_USER ?? '25',
  },
  {
    key: 'ENABLE_WEBPUSH',
    label: 'Enable Web Push Notifications',
    description:
      'Toggle the ability to register browser push subscriptions and send VAPID-based notifications.',
    category: 'notifications',
    valueType: 'boolean',
    defaultValue: process.env.ENABLE_WEBPUSH ?? 'true',
  },
  {
    key: 'ENABLE_MOBILE_PUSH',
    label: 'Enable Mobile Push Notifications',
    description:
      'Controls dispatch of mobile push notifications through Firebase Cloud Messaging.',
    category: 'notifications',
    valueType: 'boolean',
    defaultValue: process.env.ENABLE_MOBILE_PUSH ?? 'true',
  },
  {
    key: 'ENABLE_SLACK',
    label: 'Enable Slack Notifications',
    description:
      'Allow sending notifications to Slack via incoming webhooks or future OAuth integrations.',
    category: 'notifications',
    valueType: 'boolean',
    defaultValue: process.env.ENABLE_SLACK ?? 'false',
  },
  {
    key: 'ENABLE_TEAMS',
    label: 'Enable Microsoft Teams Notifications',
    description:
      'Allow sending notifications to Microsoft Teams via incoming webhooks.',
    category: 'notifications',
    valueType: 'boolean',
    defaultValue: process.env.ENABLE_TEAMS ?? 'false',
  },
  {
    key: 'REDIS_URL',
    label: 'Redis Connection URL',
    description:
      'Redis connection string used by the notification queues. Example: redis://localhost:6379/0',
    category: 'notifications',
    valueType: 'string',
    defaultValue: process.env.REDIS_URL ?? 'redis://localhost:6379/0',
  },
  {
    key: 'EMAIL_PROVIDER',
    label: 'Email Provider',
    description:
      'Select which provider the email channel should use for delivery.',
    category: 'notifications',
    valueType: 'enum',
    options: ['smtp', 'sendgrid', 'postmark', 'ses'],
    defaultValue: process.env.EMAIL_PROVIDER ?? 'smtp',
  },
  {
    key: 'SMTP_HOST',
    label: 'SMTP Host',
    description: 'SMTP server hostname when using the SMTP provider.',
    category: 'notifications',
    valueType: 'string',
    defaultValue: process.env.SMTP_HOST ?? '',
  },
  {
    key: 'SMTP_PORT',
    label: 'SMTP Port',
    description: 'Port for the SMTP server. Common values are 465 or 587.',
    category: 'notifications',
    valueType: 'string',
    defaultValue: process.env.SMTP_PORT ?? '587',
  },
  {
    key: 'SMTP_SECURE',
    label: 'SMTP Secure Connection',
    description:
      'Set to true to enforce TLS/SSL for SMTP connections. Typically true for port 465.',
    category: 'notifications',
    valueType: 'boolean',
    defaultValue: process.env.SMTP_SECURE ?? 'true',
  },
  {
    key: 'SMTP_USER',
    label: 'SMTP Username',
    description: 'Authentication username for SMTP provider.',
    category: 'notifications',
    valueType: 'string',
    defaultValue: process.env.SMTP_USER ?? '',
    isSensitive: true,
  },
  {
    key: 'SMTP_PASSWORD',
    label: 'SMTP Password',
    description: 'Authentication password for SMTP provider.',
    category: 'notifications',
    valueType: 'secret',
    defaultValue: process.env.SMTP_PASSWORD ?? '',
    isSensitive: true,
  },
  {
    key: 'SENDGRID_API_KEY',
    label: 'SendGrid API Key',
    description: 'API key for SendGrid email delivery.',
    category: 'notifications',
    valueType: 'secret',
    defaultValue: process.env.SENDGRID_API_KEY ?? '',
    isSensitive: true,
  },
  {
    key: 'POSTMARK_API_TOKEN',
    label: 'Postmark API Token',
    description: 'Server token for Postmark email delivery.',
    category: 'notifications',
    valueType: 'secret',
    defaultValue: process.env.POSTMARK_API_TOKEN ?? '',
    isSensitive: true,
  },
  {
    key: 'AWS_SES_ACCESS_KEY_ID',
    label: 'AWS SES Access Key ID',
    description: 'AWS access key ID for SES email delivery.',
    category: 'notifications',
    valueType: 'string',
    defaultValue: process.env.AWS_SES_ACCESS_KEY_ID ?? '',
    isSensitive: true,
  },
  {
    key: 'AWS_SES_SECRET_ACCESS_KEY',
    label: 'AWS SES Secret Access Key',
    description: 'AWS secret access key for SES email delivery.',
    category: 'notifications',
    valueType: 'secret',
    defaultValue: process.env.AWS_SES_SECRET_ACCESS_KEY ?? '',
    isSensitive: true,
  },
  {
    key: 'AWS_SES_REGION',
    label: 'AWS SES Region',
    description: 'Region to use for AWS SES operations (e.g., us-east-1).',
    category: 'notifications',
    valueType: 'string',
    defaultValue: process.env.AWS_SES_REGION ?? 'us-east-1',
  },
  {
    key: 'WEBPUSH_VAPID_PUBLIC_KEY',
    label: 'Web Push VAPID Public Key',
    description: 'Public VAPID key used for browser push subscriptions.',
    category: 'notifications',
    valueType: 'string',
    defaultValue: process.env.WEBPUSH_VAPID_PUBLIC_KEY ?? '',
  },
  {
    key: 'WEBPUSH_VAPID_PRIVATE_KEY',
    label: 'Web Push VAPID Private Key',
    description: 'Private VAPID key used to sign push payloads.',
    category: 'notifications',
    valueType: 'secret',
    defaultValue: process.env.WEBPUSH_VAPID_PRIVATE_KEY ?? '',
    isSensitive: true,
  },
  {
    key: 'WEBPUSH_VAPID_SUBJECT',
    label: 'Web Push VAPID Subject',
    description:
      'Contact URI or mailto address required for VAPID compliance (e.g., mailto:support@example.com).',
    category: 'notifications',
    valueType: 'string',
    defaultValue: process.env.WEBPUSH_VAPID_SUBJECT ?? '',
  },
  {
    key: 'FCM_SERVER_KEY',
    label: 'FCM Server Key',
    description: 'Legacy server key for Firebase Cloud Messaging HTTP API.',
    category: 'notifications',
    valueType: 'secret',
    defaultValue: process.env.FCM_SERVER_KEY ?? '',
    isSensitive: true,
  },
  {
    key: 'FCM_PROJECT_ID',
    label: 'FCM Project ID',
    description: 'Firebase project ID associated with the mobile apps.',
    category: 'notifications',
    valueType: 'string',
    defaultValue: process.env.FCM_PROJECT_ID ?? '',
  },
  {
    key: 'FCM_CLIENT_JSON',
    label: 'FCM Service Account JSON',
    description:
      'JSON string (or path) for Firebase service account credentials used for HTTP v1 API.',
    category: 'notifications',
    valueType: 'secret',
    defaultValue: process.env.FCM_CLIENT_JSON ?? '',
    isSensitive: true,
  },
  {
    key: 'SLACK_WEBHOOK_URL',
    label: 'Slack Incoming Webhook URL',
    description:
      'Global webhook URL for Slack notifications (per-org overrides later).',
    category: 'notifications',
    valueType: 'secret',
    defaultValue: process.env.SLACK_WEBHOOK_URL ?? '',
    isSensitive: true,
  },
  {
    key: 'TEAMS_WEBHOOK_URL',
    label: 'Microsoft Teams Webhook URL',
    description: 'Global webhook URL for Teams notifications.',
    category: 'notifications',
    valueType: 'secret',
    defaultValue: process.env.TEAMS_WEBHOOK_URL ?? '',
    isSensitive: true,
  },
];
