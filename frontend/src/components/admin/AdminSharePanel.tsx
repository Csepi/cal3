/**
 * AdminSharePanel component for managing calendar shares
 *
 * This component provides calendar share management functionality for administrators
 * including viewing all shares, user relationships, and share deletion.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, Button } from '../ui';
import { loadAdminData, formatAdminError } from './adminApiService';
import type { CalendarShare } from './types';

export interface AdminSharePanelProps {
  /** Current theme color for styling */
  themeColor?: string;
  /** Whether the panel is currently active/visible */
  isActive?: boolean;
}

/**
 * Calendar share management panel for administrators
 */
export const AdminSharePanel: React.FC<AdminSharePanelProps> = ({
  themeColor,
  isActive = false
}) => {
  const [shares, setShares] = useState<CalendarShare[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  /**
   * Load all calendar shares from the API
   */
  const loadShares = async () => {
    try {
      setLoading(true);
      setError('');

      const sharesData = await loadAdminData<CalendarShare[]>('/admin/calendar-shares');
      setShares(sharesData);

    } catch (err) {
      console.error('Error loading shares:', err);
      setError(formatAdminError(err));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete a calendar share
   */
  const deleteShare = async (shareId: number) => {
    if (!confirm('Are you sure you want to delete this calendar share? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await fetch(`/api/admin/shares/${shareId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      // Reload shares after deletion
      await loadShares();
    } catch (err) {
      console.error('Error deleting share:', err);
      setError(formatAdminError(err));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  /**
   * Auto-load shares when component becomes active
   */
  useEffect(() => {
    if (isActive && shares.length === 0) {
      loadShares();
    }
  }, [isActive]);

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
                <span>🤝</span>
                <h2 className="text-xl font-bold text-gray-800">Calendar Share Management</h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadShares}
                loading={loading}
                themeColor={themeColor}
              >
                {loading ? 'Loading...' : 'Refresh'}
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
        {loading && shares.length === 0 && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading calendar shares...</p>
          </div>
        )}

        {/* Share List */}
        {!loading && shares.length > 0 && (
          <div className="space-y-4">
            <div className="grid gap-4">
              {shares.map((share) => (
                <div
                  key={share.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div
                          className="w-5 h-5 rounded-full border-2 border-white shadow-md"
                          style={{
                            backgroundColor: share.calendar?.color || '#3b82f6',
                          }}
                        />
                        <h3 className="font-medium text-gray-900">{share.calendar?.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          share.permission === 'read'
                            ? 'bg-blue-100 text-blue-800'
                            : share.permission === 'write'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {share.permission}
                        </span>
                      </div>

                      <div className="space-y-1 text-sm text-gray-600">
                        <p>👤 Owner: {share.calendar?.owner?.firstName} {share.calendar?.owner?.lastName} ({share.calendar?.owner?.username})</p>
                        <p>🤝 Shared with: {share.sharedWith?.firstName} {share.sharedWith?.lastName} ({share.sharedWith?.username})</p>
                        <p>📅 Shared on: {formatDate(share.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        ID: {share.id}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteShare(share.id)}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && shares.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">🤝</div>
            <p className="text-gray-600 mb-4">No calendar shares found</p>
            <Button
              variant="primary"
              onClick={loadShares}
              themeColor={themeColor}
            >
              Refresh
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};