/**
 * Feature Flags Service
 *
 * Client-side service for retrieving and caching feature flag status from the backend.
 * Feature flags control which UI elements (buttons, tabs, forms) are visible to users.
 *
 * Features controlled:
 * - OAuth authentication (SSO login buttons)
 * - Calendar Sync (external calendar import tab)
 * - Reservations (reservations system tab)
 * - Automation (automation rules tab)
 */

export interface FeatureFlags {
  oauth: boolean;
  calendarSync: boolean;
  reservations: boolean;
  automation: boolean;
}

class FeatureFlagsService {
  private cache: FeatureFlags | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get feature flags from the backend
   * Results are cached for 5 minutes to reduce API calls
   */
  async getFeatureFlags(): Promise<FeatureFlags> {
    // Return cached value if still valid
    if (this.cache && Date.now() - this.cacheTimestamp < this.CACHE_DURATION) {
      return this.cache;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';
      const response = await fetch(`${apiUrl}/api/feature-flags`);

      if (!response.ok) {
        throw new Error(`Failed to fetch feature flags: ${response.statusText}`);
      }

      const flags = await response.json();

      // Update cache
      this.cache = flags;
      this.cacheTimestamp = Date.now();

      return flags;
    } catch (error) {
      console.error('Error fetching feature flags:', error);

      // Return default values (all enabled) if fetch fails
      // This ensures the app remains functional if the backend is unavailable
      const defaultFlags: FeatureFlags = {
        oauth: true,
        calendarSync: true,
        reservations: true,
        automation: true,
      };

      return defaultFlags;
    }
  }

  /**
   * Clear the cache
   * Useful when feature flags are changed and need to be refreshed immediately
   */
  clearCache(): void {
    this.cache = null;
    this.cacheTimestamp = 0;
  }
}

export const featureFlagsService = new FeatureFlagsService();
