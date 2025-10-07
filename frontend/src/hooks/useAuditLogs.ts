import { useState, useEffect, useCallback } from 'react';
import type { AuditLogDto, AuditLogQueryDto, AuditLogStatsDto } from '../types/Automation';
import { getAuditLogs, getAuditLogStats, getAllAuditLogs } from '../services/automationService';

interface UseAuditLogsOptions {
  ruleId?: number;
  query?: AuditLogQueryDto;
  autoFetch?: boolean;
}

interface UseAuditLogsReturn {
  logs: AuditLogDto[];
  stats: AuditLogStatsDto | null;
  isLoading: boolean;
  error: string | null;
  fetchLogs: () => Promise<void>;
  fetchStats: () => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

export function useAuditLogs(options: UseAuditLogsOptions = {}): UseAuditLogsReturn {
  const { ruleId, query, autoFetch = true } = options;

  const [logs, setLogs] = useState<AuditLogDto[]>([]);
  const [stats, setStats] = useState<AuditLogStatsDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch audit logs
  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let fetchedLogs: AuditLogDto[];

      if (ruleId) {
        // Fetch logs for specific rule
        fetchedLogs = await getAuditLogs(ruleId, query);
      } else {
        // Fetch all logs for user
        fetchedLogs = await getAllAuditLogs(query);
      }

      setLogs(fetchedLogs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
      console.error('Error fetching audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [ruleId, JSON.stringify(query)]);

  // Fetch statistics (only available for specific rule)
  const fetchStats = useCallback(async () => {
    if (!ruleId) {
      setStats(null);
      return;
    }

    try {
      const fetchedStats = await getAuditLogStats(ruleId);
      setStats(fetchedStats);
    } catch (err) {
      console.error('Error fetching audit stats:', err);
      // Don't set error for stats failures, as logs might still be available
    }
  }, [ruleId]);

  // Refresh both logs and stats
  const refresh = useCallback(async () => {
    await Promise.all([fetchLogs(), fetchStats()]);
  }, [fetchLogs, fetchStats]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      refresh();
    }
  }, [autoFetch, refresh]);

  return {
    logs,
    stats,
    isLoading,
    error,
    fetchLogs,
    fetchStats,
    refresh,
    clearError,
  };
}

// Helper hook for a single audit log detail
interface UseSingleAuditLogOptions {
  ruleId?: number;
  logId: number | null;
  autoFetch?: boolean;
}

interface UseSingleAuditLogReturn {
  log: AuditLogDto | null;
  isLoading: boolean;
  error: string | null;
  fetchLog: () => Promise<void>;
  clearError: () => void;
}

export function useSingleAuditLog(options: UseSingleAuditLogOptions): UseSingleAuditLogReturn {
  const { ruleId, logId, autoFetch = true } = options;

  const [log, setLog] = useState<AuditLogDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLog = useCallback(async () => {
    if (!logId) {
      setLog(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch all logs and find the specific one
      // Note: This could be optimized with a dedicated endpoint
      let logs: AuditLogDto[];

      if (ruleId) {
        logs = await getAuditLogs(ruleId);
      } else {
        logs = await getAllAuditLogs();
      }

      const foundLog = logs.find((l) => l.id === logId);

      if (foundLog) {
        setLog(foundLog);
      } else {
        setError('Audit log not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit log');
      console.error('Error fetching audit log:', err);
    } finally {
      setIsLoading(false);
    }
  }, [ruleId, logId]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    if (autoFetch && logId) {
      fetchLog();
    }
  }, [autoFetch, logId, fetchLog]);

  return {
    log,
    isLoading,
    error,
    fetchLog,
    clearError,
  };
}
