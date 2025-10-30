import { useState, useEffect } from 'react';
import { featureFlagsService, type FeatureFlags } from '../services/featureFlagsService';

/**
 * Custom hook for accessing feature flags
 *
 * Fetches feature flags from the backend on mount and provides them to components.
 * Includes loading state to prevent UI flicker while flags are being fetched.
 *
 * Usage:
 * ```tsx
 * const { flags, loading } = useFeatureFlags();
 *
 * if (!loading && flags.oauth) {
 *   // Render OAuth login buttons
 * }
 * ```
 */
export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlags>({
    oauth: true,
    calendarSync: true,
    reservations: true,
    automation: true,
    agents: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadFlags = async () => {
      try {
        setLoading(true);
        const fetchedFlags = await featureFlagsService.getFeatureFlags();

        if (mounted) {
          setFlags(fetchedFlags);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          console.error('Error loading feature flags:', err);
          setError(err instanceof Error ? err : new Error('Failed to load feature flags'));

          // Keep default flags (all enabled) on error
          setFlags({
            oauth: true,
            calendarSync: true,
            reservations: true,
            automation: true,
            agents: true,
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadFlags();

    return () => {
      mounted = false;
    };
  }, []);

  return { flags, loading, error };
}
