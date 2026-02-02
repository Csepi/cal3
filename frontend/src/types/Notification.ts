export type NotificationChannel =
  | 'inapp'
  | 'email'
  | 'webpush'
  | 'mobilepush'
  | 'slack'
  | 'teams';

export interface NotificationMessage {
  id: number;
  eventType: string;
  title?: string | null;
  body: string;
  data?: Record<string, unknown> | null;
  isRead: boolean;
  archived: boolean;
  createdAt: string;
  threadId?: number | null;
  threadKey?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface NotificationThreadSummary {
  id: number;
  threadKey: string;
  contextType?: string | null;
  contextId?: string | null;
  lastMessageAt?: string | null;
  isMuted?: boolean;
  isArchived?: boolean;
  unreadCount?: number;
}

export interface NotificationPreference {
  eventType: string;
  channels: Record<NotificationChannel, boolean> & Record<string, boolean>;
  digest?: 'immediate' | 'hourly' | 'daily';
  fallbackOrder?: NotificationChannel[];
  quietHours?: {
    start?: string;
    end?: string;
    timezone?: string;
    suppressImmediate?: boolean;
  } | null;
}

export interface NotificationInboxRuleCondition {
  field: string;
  operator: string;
  value?: string | number | boolean | Record<string, unknown> | null;
}

export interface NotificationInboxRuleAction {
  type: string;
  payload?: Record<string, unknown> | null;
}

export interface NotificationInboxRule {
  id?: number;
  name: string;
  scopeType: 'global' | 'organisation' | 'calendar' | 'reservation';
  scopeId?: string | number | null;
  isEnabled: boolean;
  conditions: NotificationInboxRuleCondition[];
  actions: NotificationInboxRuleAction[];
  continueProcessing?: boolean;
  order?: number;
}

export type NotificationFilter = NotificationInboxRule;

export interface NotificationScopeMute {
  scopeType: 'organisation' | 'calendar' | 'reservation' | 'resource' | 'thread';
  scopeId: string;
  isMuted: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationScopeOption {
  value: string;
  label: string;
  meta?: Record<string, unknown> | null;
}

export interface NotificationEventDefinition {
  type: string;
  label: string;
  description: string;
  category: 'calendar' | 'reservation' | 'event' | 'organisation' | 'automation' | 'system';
  recommendedChannels: NotificationChannel[];
  suggestedFallback?: NotificationChannel[];
}

export interface NotificationCatalogChannel {
  id: NotificationChannel;
  label: string;
  description: string;
  supportsFallback: boolean;
  realtime: boolean;
}

export interface NotificationCatalogScope {
  id: 'global' | 'organisation' | 'calendar' | 'reservation';
  label: string;
  description: string;
}

export interface NotificationCatalog {
  eventTypes: NotificationEventDefinition[];
  channels: NotificationCatalogChannel[];
  scopes: NotificationCatalogScope[];
}

export interface NotificationSocketEvent {
  type: string;
  data: Record<string, unknown> | null;
}


