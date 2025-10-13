/**
 * System Information Types
 * Mirror of backend DTOs for system info display
 */

export interface DatabaseInfo {
  type: string;
  host?: string;
  port?: number;
  database?: string;
  ssl?: boolean;
  poolMax?: number;
  poolMin?: number;
  connectionTimeout?: number;
  synchronized?: boolean;
}

export interface MemoryUsage {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
}

export interface CpuUsage {
  user: number;
  system: number;
}

export interface ServerInfo {
  nodeVersion: string;
  platform: string;
  architecture: string;
  uptime: number;
  memoryUsage: MemoryUsage;
  cpuUsage: CpuUsage;
}

export interface EnvironmentInfo {
  nodeEnv: string;
  port: number;
  baseUrl: string;
  frontendUrl: string;
  backendUrl: string;
}

export interface FeatureFlags {
  googleOAuthEnabled: boolean;
  microsoftOAuthEnabled: boolean;
  calendarSyncEnabled: boolean;
  automationEnabled: boolean;
  reservationsEnabled: boolean;
  organisationsEnabled: boolean;
}

export interface DatabaseStats {
  users: number;
  calendars: number;
  events: number;
  reservations: number;
  automationRules: number;
  organisations: number;
}

export interface SystemInfo {
  server: ServerInfo;
  database: DatabaseInfo;
  environment: EnvironmentInfo;
  features: FeatureFlags;
  stats: DatabaseStats;
  timestamp: string;
  version: string;
}
