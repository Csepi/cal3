/**
 * AdminCalendarPanel component for managing calendars
 *
 * This component provides calendar management functionality for administrators
 * including viewing all calendars, user ownership, and calendar deletion.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, Button } from '../ui';
import { loadAdminData, formatAdminError, adminApiCall, getAdminToken } from './adminApiService';
import type { Calendar } from './types';

export interface AdminCalendarPanelProps {
  /** Current theme color for styling */
  themeColor?: string;
  /** Whether the panel is currently active/visible */
  isActive?: boolean;
}

/**
 * Calendar management panel for administrators
 */
export const AdminCalendarPanel: React.FC<AdminCalendarPanelProps> = ({
  themeColor,
  isActive = false
}) => {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  /**
   * Load all calendars from the API
   */
  const loadCalendars = async () => {
    try {
      setLoading(true);
      setError('');

      const calendarsData = await loadAdminData<Calendar[]>('/admin/calendars');
      setCalendars(calendarsData);

    } catch (err) {
      console.error('Error loading calendars:', err);
      setError(formatAdminError(err));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete a calendar
   */
  const deleteCalendar = async (calendarId: number) => {
    if (!confirm('Are you sure you want to delete this calendar? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const token = getAdminToken();
      if (!token) {
        throw new Error('No admin token found. Please login as admin.');
      }

      await adminApiCall({
        endpoint: `/admin/calendars/${calendarId}`,
        token,
        method: 'DELETE'
      });

      // Reload calendars after deletion
      await loadCalendars();
    } catch (err) {
      console.error('Error deleting calendar:', err);
      setError(formatAdminError(err));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Auto-load calendars when component becomes active
   */
  useEffect(() => {
    if (isActive && calendars.length === 0) {
      loadCalendars();
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
                <span>📅</span>
                <h2 className="text-xl font-bold text-gray-800">Calendar Management</h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadCalendars}
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
        {loading && calendars.length === 0 && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading calendars...</p>
          </div>
        )}

        {/* Calendar List */}
        {!loading && calendars.length > 0 && (
          <div className="space-y-4">
            <div className="grid gap-4">
              {calendars.map((calendar) => (
                <div
                  key={calendar.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                        style={{
                          backgroundColor: calendar.color || '#3b82f6',
                        }}
                      />
                      <div>
                        <h3 className="font-medium text-gray-900">{calendar.name}</h3>
                        <p className="text-sm text-gray-500">
                          Owner: {calendar.owner?.firstName} {calendar.owner?.lastName} ({calendar.owner?.username})
                        </p>
                        {calendar.description && (
                          <p className="text-xs text-gray-400 mt-1">{calendar.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        ID: {calendar.id}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteCalendar(calendar.id)}
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
        {!loading && calendars.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">📅</div>
            <p className="text-gray-600 mb-4">No calendars found</p>
            <Button
              variant="primary"
              onClick={loadCalendars}
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