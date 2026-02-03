export type DatabaseEngine = 'sqlite' | 'postgres' | 'mssql';

/**
 * Runtime database configuration used by the backend.
 */
export interface DatabaseConfig {
  readonly engine: DatabaseEngine;
  readonly host?: string;
  readonly port?: number;
  readonly username?: string;
  readonly password?: string;
  readonly database: string;
  readonly sslEnabled?: boolean;
  readonly sslRejectUnauthorized?: boolean;
  readonly synchronize: boolean;
  readonly logging: boolean;
  readonly poolMax?: number;
  readonly poolMin?: number;
  readonly connectionTimeoutMs?: number;
  readonly idleTimeoutMs?: number;
}

export interface OAuthProviderConfig {
  readonly clientId: string;
  readonly clientSecret: string;
  readonly callbackUrl: string;
}

export interface OAuthConfig {
  readonly enabled: boolean;
  readonly google?: OAuthProviderConfig;
  readonly microsoft?: OAuthProviderConfig & {
    readonly tenantId?: string;
  };
}

export interface AppConfig {
  readonly nodeEnv: 'development' | 'test' | 'production' | string;
  readonly port: number;
  readonly frontendBaseUrl: string;
  readonly backendBaseUrl: string;
  readonly jwt: {
    readonly secret: string;
    readonly issuer: string;
    readonly audience: string;
    readonly expiresIn: string;
  };
  readonly database: DatabaseConfig;
  readonly oauth: OAuthConfig;
}
