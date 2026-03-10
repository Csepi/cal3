export type ApiRateTier = 'guest' | 'user' | 'premium';

export type EndpointCategory = 'auth' | 'booking' | 'admin' | 'default';

export type ApiKeyScope = 'read' | 'write' | 'admin';

export interface RateLimitRule {
  limit: number;
  windowSeconds: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  tier: ApiRateTier;
  category: EndpointCategory;
  limit: number;
  remaining: number;
  resetAtEpochSeconds: number;
  retryAfterSeconds?: number;
}

export interface ApiKeyAuthContext {
  id: number;
  userId: number;
  scopes: ApiKeyScope[];
  tier: ApiRateTier;
  rotationRequired: boolean;
}
