import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { featureFlagsService, type FeatureFlags } from '../services/featureFlagsService';

interface FeatureFlagsContextValue {
  flags: FeatureFlags;
  loading: boolean;
  error: Error | null;
  isFeatureEnabled: (featureName: keyof FeatureFlags) => boolean;
  refreshFlags: () => Promise<void>;
}

const defaultFlags: FeatureFlags = {
  oauth: true,
  calendarSync: true,
  reservations: true,
  automation: true,
  agents: true,
  tasks: true,
};

const FeatureFlagsContext = createContext<FeatureFlagsContextValue | null>(null);

export const FeatureFlagsProvider = ({ children }: { children: ReactNode }) => {
  const [flags, setFlags] = useState<FeatureFlags>(defaultFlags);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshFlags = useCallback(async () => {
    setLoading(true);
    try {
      const fetched = await featureFlagsService.getFeatureFlags();
      setFlags(fetched);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load feature flags'));
      setFlags(defaultFlags);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFlags().catch(() => {
      setFlags(defaultFlags);
      setLoading(false);
    });
  }, [refreshFlags]);

  const isFeatureEnabled = useCallback((featureName: keyof FeatureFlags) => {
    return Boolean(flags[featureName]);
  }, [flags]);

  const contextValue = useMemo<FeatureFlagsContextValue>(() => ({
    flags,
    loading,
    error,
    isFeatureEnabled,
    refreshFlags,
  }), [flags, loading, error, isFeatureEnabled, refreshFlags]);

  return (
    <FeatureFlagsContext.Provider value={contextValue}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

export const useFeatureFlags = (): FeatureFlagsContextValue => {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  return context;
};
