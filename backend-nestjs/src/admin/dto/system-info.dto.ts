/**
 * System Information DTOs
 * Provides runtime and configuration information for admin dashboard
 */

export class DatabaseInfoDto {
  type!: string;
  host?: string;
  port?: number;
  database?: string;
  ssl?: boolean;
  poolMax?: number;
  poolMin?: number;
  connectionTimeout?: number;
  synchronized?: boolean;
}

export class ServerInfoDto {
  nodeVersion!: string;
  platform!: string;
  architecture!: string;
  uptime!: number;
  memoryUsage!: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  cpuUsage!: {
    user: number;
    system: number;
  };
}

export class EnvironmentInfoDto {
  nodeEnv!: string;
  port!: number;
  baseUrl!: string;
  frontendUrl!: string;
  backendUrl!: string;
}

export class FeatureFlagsDto {
  googleOAuthEnabled!: boolean;
  microsoftOAuthEnabled!: boolean;
  calendarSyncEnabled!: boolean;
  automationEnabled!: boolean;
  reservationsEnabled!: boolean;
  organisationsEnabled!: boolean;
}

export class DatabaseStatsDto {
  users!: number;
  calendars!: number;
  events!: number;
  reservations!: number;
  automationRules!: number;
  organisations!: number;
}

export class SystemInfoDto {
  server!: ServerInfoDto;
  database!: DatabaseInfoDto;
  environment!: EnvironmentInfoDto;
  features!: FeatureFlagsDto;
  stats!: DatabaseStatsDto;
  timestamp!: string;
  version!: string;
}
