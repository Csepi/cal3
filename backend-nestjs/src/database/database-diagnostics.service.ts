import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { logError } from '../common/errors/error-logger';
import { buildErrorContext } from '../common/errors/error-context';
/**
 * Database Diagnostics Service
 * Provides detailed logging and diagnostics for database connections
 */
@Injectable()
export class DatabaseDiagnosticsService {
  private readonly logger = new Logger(DatabaseDiagnosticsService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Log all database configuration details (with password redacted)
   */
  logDatabaseConfig(): void {
    const dbType = this.configService.get('DB_TYPE');

    this.logger.log('========================================');
    this.logger.log('DATABASE CONNECTION CONFIGURATION');
    this.logger.log('========================================');

    if (dbType === 'postgres') {
      const host = this.configService.get('DB_HOST', 'localhost');
      const port = this.configService.get('DB_PORT', '5432');
      const username = this.configService.get('DB_USERNAME', 'postgres');
      const database = this.configService.get('DB_NAME', 'cal3');
      const ssl = this.configService.get('DB_SSL', 'false');
      const sslRejectUnauthorized = this.configService.get(
        'DB_SSL_REJECT_UNAUTHORIZED',
        'true',
      );
      const connectionTimeout = this.configService.get(
        'DB_CONNECTION_TIMEOUT',
        '10000',
      );
      const idleTimeout = this.configService.get('DB_IDLE_TIMEOUT', '30000');
      const poolMax = this.configService.get('DB_POOL_MAX', '10');
      const poolMin = this.configService.get('DB_POOL_MIN', '2');
      const synchronize = this.configService.get('DB_SYNCHRONIZE', 'false');
      const logging = this.configService.get('DB_LOGGING', 'false');

      this.logger.log(`Database Type: PostgreSQL`);
      this.logger.log(`Host: ${host}`);
      this.logger.log(`Port: ${port}`);
      this.logger.log(`Database: ${database}`);
      this.logger.log(`Username: ${username}`);
      this.logger.log(
        `Password: ${this.configService.get('DB_PASSWORD') ? '[SET - ' + this.configService.get('DB_PASSWORD').length + ' chars]' : '[NOT SET]'}`,
      );
      this.logger.log(`SSL Enabled: ${ssl}`);
      this.logger.log(`SSL Reject Unauthorized: ${sslRejectUnauthorized}`);
      this.logger.log(`Connection Timeout: ${connectionTimeout}ms`);
      this.logger.log(`Idle Timeout: ${idleTimeout}ms`);
      this.logger.log(`Pool Max: ${poolMax}`);
      this.logger.log(`Pool Min: ${poolMin}`);
      this.logger.log(`Synchronize: ${synchronize}`);
      this.logger.log(`Logging: ${logging}`);

      // Connection string (without password)
      const sslParam = ssl === 'true' ? '?ssl=true' : '';
      this.logger.log(
        `Connection String: postgresql://${username}:***@${host}:${port}/${database}${sslParam}`,
      );

      // Warnings
      if (host.includes('azure.com') || host.includes('amazonaws.com')) {
        this.logger.warn(
          '⚠️  Detected cloud database provider - ensure firewall rules allow this IP',
        );
      }

      if (parseInt(connectionTimeout) < 30000) {
        this.logger.warn(
          '⚠️  Connection timeout is less than 30 seconds - may be insufficient for cloud databases',
        );
      }

      if (
        ssl !== 'true' &&
        (host.includes('azure.com') || host.includes('amazonaws.com'))
      ) {
        this.logger.warn(
          '⚠️  SSL is not enabled but connecting to cloud database - this may fail',
        );
      }
    } else {
      const database = this.configService.get('DB_DATABASE', 'cal3.db');
      this.logger.log(`Database Type: SQLite`);
      this.logger.log(`Database File: ${database}`);
    }

    this.logger.log('========================================');
  }

  /**
   * Log connection attempt start
   */
  logConnectionAttempt(attemptNumber: number = 1): void {
    const timestamp = new Date().toISOString();
    this.logger.log(
      `[${timestamp}] 🔌 Connection Attempt #${attemptNumber} - Starting...`,
    );
  }

  /**
   * Log successful connection
   */
  logConnectionSuccess(duration: number): void {
    const timestamp = new Date().toISOString();
    this.logger.log(
      `[${timestamp}] ✅ Connection Successful! (took ${duration}ms)`,
    );
  }

  /**
   * Log connection failure with detailed error
   */
  logConnectionFailure(
    error: any,
    attemptNumber: number,
    willRetry: boolean,
  ): void {
    const timestamp = new Date().toISOString();
    this.logger.error(
      `[${timestamp}] ❌ Connection Failed - Attempt #${attemptNumber}`,
    );
    this.logger.error(`Error Type: ${error.name || 'Unknown'}`);
    this.logger.error(`Error Message: ${error.message || 'No message'}`);

    if (error.code) {
      this.logger.error(`Error Code: ${error.code}`);
    }

    // Provide specific diagnostics based on error type
    if (error.message?.includes('timeout')) {
      this.logger.error(
        '┌─────────────────────────────────────────────────────────┐',
      );
      this.logger.error(
        '│ DIAGNOSIS: CONNECTION TIMEOUT                           │',
      );
      this.logger.error(
        '├─────────────────────────────────────────────────────────┤',
      );
      this.logger.error(
        '│ Most common causes:                                     │',
      );
      this.logger.error(
        '│ 1. Firewall blocking connection (Azure/AWS)            │',
      );
      this.logger.error(
        '│ 2. Database server is down or unreachable              │',
      );
      this.logger.error(
        '│ 3. Network routing issue                                │',
      );
      this.logger.error(
        '│ 4. Incorrect host/port configuration                    │',
      );
      this.logger.error(
        '├─────────────────────────────────────────────────────────┤',
      );
      this.logger.error(
        '│ Solutions:                                              │',
      );
      this.logger.error(
        '│ • Add your IP to database firewall rules               │',
      );
      this.logger.error(
        '│ • Verify DB_HOST and DB_PORT are correct               │',
      );
      this.logger.error(
        '│ • Test connection: nc -zv <host> <port>                │',
      );
      this.logger.error(
        '│ • Check container can reach internet: ping 8.8.8.8     │',
      );
      this.logger.error(
        '└─────────────────────────────────────────────────────────┘',
      );
    } else if (error.message?.includes('password')) {
      this.logger.error(
        '┌─────────────────────────────────────────────────────────┐',
      );
      this.logger.error(
        '│ DIAGNOSIS: AUTHENTICATION FAILED                        │',
      );
      this.logger.error(
        '├─────────────────────────────────────────────────────────┤',
      );
      this.logger.error(
        '│ • Verify DB_USERNAME is correct                         │',
      );
      this.logger.error(
        '│ • Verify DB_PASSWORD is correct                         │',
      );
      this.logger.error(
        '│ • Check password for special characters                 │',
      );
      this.logger.error(
        '└─────────────────────────────────────────────────────────┘',
      );
    } else if (
      error.message?.includes('ENOTFOUND') ||
      error.message?.includes('getaddrinfo')
    ) {
      this.logger.error(
        '┌─────────────────────────────────────────────────────────┐',
      );
      this.logger.error(
        '│ DIAGNOSIS: DNS RESOLUTION FAILED                        │',
      );
      this.logger.error(
        '├─────────────────────────────────────────────────────────┤',
      );
      this.logger.error(
        '│ • Cannot resolve hostname to IP address                 │',
      );
      this.logger.error(
        '│ • Test DNS: nslookup <hostname>                         │',
      );
      this.logger.error(
        '│ • Verify DB_HOST is spelled correctly                   │',
      );
      this.logger.error(
        '│ • Check container has DNS access                        │',
      );
      this.logger.error(
        '└─────────────────────────────────────────────────────────┘',
      );
    } else if (error.message?.includes('ECONNREFUSED')) {
      this.logger.error(
        '┌─────────────────────────────────────────────────────────┐',
      );
      this.logger.error(
        '│ DIAGNOSIS: CONNECTION REFUSED                           │',
      );
      this.logger.error(
        '├─────────────────────────────────────────────────────────┤',
      );
      this.logger.error(
        '│ • Database server is not accepting connections          │',
      );
      this.logger.error(
        '│ • Wrong port number                                     │',
      );
      this.logger.error(
        '│ • Database service is not running                       │',
      );
      this.logger.error(
        '└─────────────────────────────────────────────────────────┘',
      );
    } else if (
      error.message?.includes('SSL') ||
      error.message?.includes('ssl')
    ) {
      this.logger.error(
        '┌─────────────────────────────────────────────────────────┐',
      );
      this.logger.error(
        '│ DIAGNOSIS: SSL/TLS ERROR                                │',
      );
      this.logger.error(
        '├─────────────────────────────────────────────────────────┤',
      );
      this.logger.error(
        '│ • SSL configuration mismatch                            │',
      );
      this.logger.error(
        '│ • Try DB_SSL=true or DB_SSL=false                       │',
      );
      this.logger.error(
        '│ • Try DB_SSL_REJECT_UNAUTHORIZED=false                  │',
      );
      this.logger.error(
        '└─────────────────────────────────────────────────────────┘',
      );
    }

    if (willRetry) {
      this.logger.warn(`⏳ Will retry connection...`);
    } else {
      this.logger.error('🛑 No more retries - application will fail to start');
    }

    this.logger.error(
      '────────────────────────────────────────────────────────────',
    );
  }

  /**
   * Log query execution (for debugging)
   */
  logQuery(query: string, parameters?: any[], duration?: number): void {
    if (this.configService.get('DB_LOGGING') === 'true') {
      const timestamp = new Date().toISOString();
      const durationStr = duration ? ` (${duration}ms)` : '';
      this.logger.debug(`[${timestamp}] 📝 Query${durationStr}: ${query}`);
      if (parameters && parameters.length > 0) {
        this.logger.debug(`Parameters: ${JSON.stringify(parameters)}`);
      }
    }
  }

  /**
   * Test network connectivity to database host
   */
  async testNetworkConnectivity(): Promise<void> {
    const host = this.configService.get('DB_HOST', 'localhost');
    const port = this.configService.get('DB_PORT', '5432');

    this.logger.log('========================================');
    this.logger.log('NETWORK CONNECTIVITY TEST');
    this.logger.log('========================================');

    // Test 1: DNS Resolution
    try {
      this.logger.log(`Testing DNS resolution for ${host}...`);
      const dns = require('dns').promises;
      const addresses = await dns.resolve4(host);
      this.logger.log(`✅ DNS Resolution: Success`);
      this.logger.log(`   Resolved to: ${addresses.join(', ')}`);
    } catch (error) {
      logError(error, buildErrorContext({ action: 'database-diagnostics.service' }));
      this.logger.error(`❌ DNS Resolution: Failed`);
      this.logger.error(`   Error: ${error.message}`);
    }

    // Test 2: TCP Connection
    try {
      this.logger.log(`Testing TCP connection to ${host}:${port}...`);
      const net = require('net');
      const socket = new net.Socket();

      await new Promise((resolve, reject) => {
        socket.setTimeout(10000);
        socket.on('connect', () => {
          this.logger.log(`✅ TCP Connection: Success`);
          socket.destroy();
          resolve(true);
        });
        socket.on('timeout', () => {
          socket.destroy();
          reject(new Error('Connection timeout'));
        });
        socket.on('error', (err) => {
          socket.destroy();
          reject(err);
        });
        socket.connect(parseInt(port), host);
      });
    } catch (error) {
      logError(error, buildErrorContext({ action: 'database-diagnostics.service' }));
      this.logger.error(`❌ TCP Connection: Failed`);
      this.logger.error(`   Error: ${error.message}`);
    }

    this.logger.log('========================================');
  }
}
