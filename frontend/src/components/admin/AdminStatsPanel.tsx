/**
 * AdminStatsPanel component for displaying database statistics
 *
 * This component provides a comprehensive overview of database statistics
 * including user counts, calendar metrics, event totals, and sharing data.
 * It features real-time updates and visual indicators for key metrics.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, Button } from '../ui';
import { loadAdminData, formatAdminError } from './adminApiService';
import { DatabaseStats } from './types';

export interface AdminStatsPanelProps {
  /** Current theme color for styling */
  themeColor?: string;
  /** Whether the panel is currently active/visible */
  isActive?: boolean;
}

/**
 * Statistics panel component displaying key database metrics with refresh capability
 */
export const AdminStatsPanel: React.FC<AdminStatsPanelProps> = ({
  themeColor,
  isActive = false
}) => {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  /**
   * Load database statistics from the API
   */
  const loadStats = async () => {
    try {
      setLoading(true);
      setError('');

      const statsData = await loadAdminData<DatabaseStats>('/admin/stats');
      setStats(statsData);

    } catch (err) {
      console.error('Error loading stats:', err);
      setError(formatAdminError(err));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Auto-load stats when component becomes active
   */
  useEffect(() => {
    if (isActive && !stats) {
      loadStats();
    }
  }, [isActive]);

  /**
   * Render individual stat card
   */
  const renderStatCard = (
    title: string,
    value: number | string,
    subtitle?: string,
    icon?: string,
    colorClass?: string
  ) => (
    <div className={`bg-white rounded-lg p-4 border-l-4 ${colorClass || 'border-blue-400'} shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="text-2xl opacity-60">{icon}</div>
        )}
      </div>
    </div>
  );

  /**
   * Calculate derived statistics
   */
  const getDerivedStats = () => {
    if (!stats) return null;

    const activeUserPercentage = stats.users.total > 0
      ? Math.round((stats.users.active / stats.users.total) * 100)
      : 0;

    const adminPercentage = stats.users.total > 0
      ? Math.round((stats.users.admins / stats.users.total) * 100)
      : 0;

    const eventsPerCalendar = stats.calendars.total > 0
      ? Math.round(stats.events.total / stats.calendars.total)
      : 0;

    return {
      activeUserPercentage,
      adminPercentage,
      eventsPerCalendar
    };
  };

  const derivedStats = getDerivedStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card
        themeColor={themeColor}
        padding="lg"
        header={
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span>📊</span>
                <h2 className="text-xl font-bold text-gray-800">Database Statistics</h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadStats}
                loading={loading}
                themeColor={themeColor}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </CardHeader>
        }
      >
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && !stats && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading database statistics...</p>
          </div>
        )}

        {/* Statistics Grid */}
        {stats && (
          <div className="space-y-6">
            {/* Main Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {renderStatCard(
                'Total Users',
                stats.users.total.toLocaleString(),
                `${stats.users.active} active (${derivedStats?.activeUserPercentage}%)`,
                '👥',
                'border-blue-400'
              )}

              {renderStatCard(
                'Calendars',
                stats.calendars.total.toLocaleString(),
                `${derivedStats?.eventsPerCalendar} avg events/calendar`,
                '📅',
                'border-green-400'
              )}

              {renderStatCard(
                'Events',
                stats.events.total.toLocaleString(),
                'Scheduled events',
                '📝',
                'border-purple-400'
              )}

              {renderStatCard(
                'Calendar Shares',
                stats.shares.total.toLocaleString(),
                'Shared calendar instances',
                '🤝',
                'border-orange-400'
              )}
            </div>

            {/* User Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {renderStatCard(
                'Active Users',
                stats.users.active.toLocaleString(),
                `${derivedStats?.activeUserPercentage}% of total users`,
                '✅',
                'border-green-500'
              )}

              {renderStatCard(
                'Administrator Users',
                stats.users.admins.toLocaleString(),
                `${derivedStats?.adminPercentage}% of total users`,
                '🔐',
                'border-red-500'
              )}

              {renderStatCard(
                'Inactive Users',
                (stats.users.total - stats.users.active).toLocaleString(),
                `${100 - (derivedStats?.activeUserPercentage || 0)}% of total users`,
                '⏸️',
                'border-gray-400'
              )}
            </div>

            {/* Last Updated */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Last updated: {new Date(stats.lastUpdated).toLocaleString()}</span>
                </div>
                <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Live Data
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !stats && !error && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">📊</div>
            <p className="text-gray-600 mb-4">No statistics available</p>
            <Button
              variant="primary"
              onClick={loadStats}
              themeColor={themeColor}
            >
              Load Statistics
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};