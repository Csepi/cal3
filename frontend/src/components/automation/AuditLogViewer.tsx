import React, { useState, useMemo, type ReactElement } from 'react';
import { AuditLogStatus } from '../../types/Automation';
import type { AuditLogQueryDto } from '../../types/Automation';
import { useAuditLogs } from '../../hooks/useAuditLogs';
import { formatRelativeTime, getStatusColor } from '../../services/automationService';
import { AuditLogDetailModal } from './AuditLogDetailModal';

import { tStatic } from '../../i18n';

interface AuditLogViewerProps {
  ruleId?: number;
  themeColor?: string;
}

type DateRangeOption = 'last_7_days' | 'last_30_days' | 'last_90_days' | 'all';

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  ruleId,
  themeColor = '#3b82f6',
}) => {
  const [statusFilter, setStatusFilter] = useState<AuditLogStatus | 'all'>('all');
  const [dateRange, setDateRange] = useState<DateRangeOption>('last_30_days');
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);

  // Memoize query object to prevent unnecessary re-renders
  const query = useMemo<AuditLogQueryDto>(() => {
    // Calculate date range
    let fromDate: string | undefined;
    if (dateRange !== 'all') {
      const now = new Date();
      const daysAgo = {
        last_7_days: 7,
        last_30_days: 30,
        last_90_days: 90,
      }[dateRange];

      const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      fromDate = startDate.toISOString();
    }

    return {
      status: statusFilter === 'all' ? undefined : statusFilter,
      fromDate,
      limit: 100,
    };
  }, [statusFilter, dateRange]);

  // Fetch logs with current filters
  const { logs, stats, isLoading, error, refresh } = useAuditLogs({
    ruleId,
    query,
  });

  // Get status icon
  const getStatusIcon = (status: AuditLogStatus): ReactElement => {
    const color = getStatusColor(status);
    const icons = {
      success: '✓',
      partial_success: '◐',
      failure: '✗',
      skipped: '⊘',
    };

    const colors = {
      green: 'text-green-600',
      yellow: 'text-yellow-600',
      red: 'text-red-600',
      gray: 'text-gray-400',
    };

    return <span className={colors[color]}>{icons[status]}</span>;
  };

  // Format date/time
  const formatDateTime = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{tStatic('common:auto.frontend.k9215c729df82')}</h3>
          {stats && (
            <p className="text-sm text-gray-600 mt-1">
              {stats.totalExecutions} {tStatic('common:auto.frontend.k7edf30a51e2b')}{stats.successCount} {tStatic('common:auto.frontend.kde6a766415ef')}{' '}
              {stats.failureCount} {tStatic('common:auto.frontend.k5f5f8758f5f2')}{stats.lastExecutedAt && (
                <> {tStatic('common:auto.frontend.kc2aca646d5d9')}{formatRelativeTime(stats.lastExecutedAt)}</>
              )}
            </p>
          )}
        </div>
        <button
          onClick={refresh}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center gap-1"
          disabled={isLoading}
        >
          <svg
            className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {tStatic('common:auto.frontend.k56e3badc4e6c')}</button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Status Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{tStatic('common:auto.frontend.kbae7d5be7082')}</label>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as AuditLogStatus | 'all')
            }
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{tStatic('common:auto.frontend.k9cb29e734a6c')}</option>
            <option value="success">{tStatic('common:auto.frontend.k42a8f651d79f')}</option>
            <option value="partial_success">{tStatic('common:auto.frontend.kb9e9c3170d42')}</option>
            <option value="failure">{tStatic('common:auto.frontend.k09fef5d8d9a3')}</option>
            <option value="skipped">{tStatic('common:auto.frontend.k5a000ad7bd1b')}</option>
          </select>
        </div>

        {/* Date Range Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{tStatic('common:auto.frontend.k6bb4b674b323')}</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRangeOption)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="last_7_days">{tStatic('common:auto.frontend.kdf833fe88d38')}</option>
            <option value="last_30_days">{tStatic('common:auto.frontend.k6b32985251a1')}</option>
            <option value="last_90_days">{tStatic('common:auto.frontend.kc328508badd7')}</option>
            <option value="all">{tStatic('common:auto.frontend.kdbad49d89123')}</option>
          </select>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && logs.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div
              className="inline-block w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"
              style={{ borderTopColor: themeColor }}
            />
            <p className="mt-3 text-sm text-gray-600">{tStatic('common:auto.frontend.kf780261e93a1')}</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && logs.length === 0 && (
        <div className="flex items-center justify-center py-12 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-center max-w-md">
            <div className="text-4xl mb-3">📊</div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">{tStatic('common:auto.frontend.k0eb39cd6d7a4')}</h4>
            <p className="text-sm text-gray-600">
              {ruleId
                ? 'This rule has not been executed yet. Enable the rule and trigger events to see execution history.'
                : 'No automation rules have been executed yet. Create and enable rules to see execution history.'}
            </p>
          </div>
        </div>
      )}

      {/* Logs Table */}
      {!isLoading && logs.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    {tStatic('common:auto.frontend.k853aab7f564c')}</th>
                  {!ruleId && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      {tStatic('common:auto.frontend.k78e1790e29a5')}</th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    {tStatic('common:auto.frontend.kad8919ace091')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    {tStatic('common:auto.frontend.kbae7d5be7082')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    {tStatic('common:auto.frontend.k1370004da76f')}</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                    {tStatic('common:auto.frontend.kc3cd636a585b')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLogId(log.id)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(log.executedAt)}
                    </td>
                    {!ruleId && (
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="max-w-xs truncate">{log.ruleName}</div>
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="max-w-xs truncate">
                        {log.eventTitle || <span className="text-gray-400 italic">{tStatic('common:auto.frontend.kec4347fc4cff')}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        <span className="capitalize">{log.status.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {log.executionTimeMs}{tStatic('common:auto.frontend.k26cc3217be64')}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLogId(log.id);
                        }}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {tStatic('common:auto.frontend.kcf3dbdab782e')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Results Count */}
      {logs.length > 0 && (
        <div className="text-sm text-gray-600">
          {tStatic('common:auto.frontend.k163d8174ff4b')}{logs.length} {tStatic('common:auto.frontend.k1e2147459888')}{logs.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Detail Modal */}
      {selectedLogId && (
        <AuditLogDetailModal
          logId={selectedLogId}
          ruleId={ruleId}
          onClose={() => setSelectedLogId(null)}
          themeColor={themeColor}
        />
      )}
    </div>
  );
};
