export type ConsentType =
  | 'privacy_policy'
  | 'terms_of_service'
  | 'marketing_email'
  | 'data_processing'
  | 'cookie_analytics';

export type ConsentDecision = 'accepted' | 'revoked';

export interface PrivacyConsentRecord {
  id: number;
  consentType: ConsentType;
  policyVersion: string;
  decision: ConsentDecision;
  acceptedAt: string | null;
  revokedAt: string | null;
  source: string | null;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
}

export interface DataSubjectRequestRecord {
  id: number;
  userId: number;
  requestType: 'access' | 'export' | 'delete';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  reason: string | null;
  adminNotes: string | null;
  handledByUserId: number | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  payload?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

export interface PrivacyAccessReport {
  generatedAt: string;
  profile: {
    id: number;
    username: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    role: string;
    createdAt: string;
    updatedAt: string;
    privacyPolicyAcceptedAt: string | null;
    privacyPolicyVersion: string | null;
  };
  footprint: {
    ownedCalendars: number;
    createdEvents: number;
    reservationsCreated: number;
    ownedTasks: number;
  };
  consents: PrivacyConsentRecord[];
  recentRequests: DataSubjectRequestRecord[];
}

export interface PersonalDataExport {
  exportedAt: string;
  profile: Record<string, unknown>;
  calendars: Array<Record<string, unknown>>;
  events: Array<Record<string, unknown>>;
  reservations: Array<Record<string, unknown>>;
  tasks: Array<Record<string, unknown>>;
  consents: PrivacyConsentRecord[];
}

export interface DataSubjectRequestListResponse {
  count: number;
  items: DataSubjectRequestRecord[];
}
