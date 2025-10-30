import { Injectable } from '@nestjs/common';

/**
 * Feature Flags Service
 *
 * Centralized service for managing application feature flags.
 * Feature flags control the availability of features across the application,
 * allowing features to be enabled or disabled via environment variables.
 *
 * Available Feature Flags:
 * - ENABLE_OAUTH: Enable/disable OAuth authentication (Google, Microsoft)
 * - ENABLE_CALENDAR_SYNC: Enable/disable external calendar synchronization
 * - ENABLE_RESERVATIONS: Enable/disable reservation system
 * - ENABLE_AUTOMATION: Enable/disable automation rules system
 *
 * Usage:
 * - Set environment variables to 'true' to enable features
 * - Any other value (including undefined) will disable the feature
 * - Frontend buttons/tabs will be hidden when features are disabled
 * - Backend endpoints remain accessible but UI is hidden
 */
@Injectable()
export class FeatureFlagsService {
  /**
   * Check if OAuth authentication is enabled
   * Controls visibility of SSO login buttons (Google, Microsoft)
   */
  isOAuthEnabled(): boolean {
    return process.env.ENABLE_OAUTH === 'true';
  }

  /**
   * Check if Calendar Sync is enabled
   * Controls visibility of Calendar Sync tab and external calendar import features
   */
  isCalendarSyncEnabled(): boolean {
    return process.env.ENABLE_CALENDAR_SYNC === 'true';
  }

  /**
   * Check if Reservations system is enabled
   * Controls visibility of Reservations tab (in addition to user permissions)
   */
  isReservationsEnabled(): boolean {
    return process.env.ENABLE_RESERVATIONS === 'true';
  }

  /**
   * Check if Automation system is enabled
   * Controls visibility of Automation tab and rule management features
   */
  isAutomationEnabled(): boolean {
    return process.env.ENABLE_AUTOMATION === 'true';
  }

  /**
   * Check if MCP agent integrations are enabled
   * Controls visibility of Agent settings tab and API endpoints
   */
  isAgentIntegrationsEnabled(): boolean {
    return process.env.ENABLE_AGENT_INTEGRATIONS === 'true';
  }

  /**
   * Get all feature flags as an object
   * Used by frontend to determine which features to display
   */
  getAllFeatureFlags(): {
    oauth: boolean;
    calendarSync: boolean;
    reservations: boolean;
    automation: boolean;
    agents: boolean;
  } {
    return {
      oauth: this.isOAuthEnabled(),
      calendarSync: this.isCalendarSyncEnabled(),
      reservations: this.isReservationsEnabled(),
      automation: this.isAutomationEnabled(),
      agents: this.isAgentIntegrationsEnabled(),
    };
  }
}
