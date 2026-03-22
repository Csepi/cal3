/**
 * AdminEventPanel component for managing events
 *
 * This component provides event management functionality for administrators
 * including viewing all events, user ownership, and event deletion.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, Button } from '../ui';
import { loadAdminData, formatAdminError, adminApiCall } from './adminApiService';
import type { Event } from './types';

import { i18n, tStatic } from '../../i18n';

export interface AdminEventPanelProps {
  /** Current theme color for styling */
  themeColor?: string;
  /** Whether the panel is currently active/visible */
  isActive?: boolean;
}

/**
 * Event management panel for administrators
 */
export const AdminEventPanel: React.FC<AdminEventPanelProps> = ({
  themeColor,
  isActive = false
}) => {
  const locale = i18n.resolvedLanguage || i18n.language || undefined;
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  /**
   * Load all events from the API
   */
  const loadEvents = async () => {
    try {
      setLoading(true);
      setError('');

      const eventsData = await loadAdminData<Event[]>('/admin/events');
      setEvents(eventsData);

    } catch (err) {
      console.error('Error loading events:', err);
      setError(formatAdminError(err));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete an event
   */
  const deleteEvent = async (eventId: number) => {
    if (!confirm(tStatic('common:auto.frontend.k1ced43fa08df'))) {
      return;
    }

    try {
      setLoading(true);

      await adminApiCall({
        endpoint: `/admin/events/${eventId}`,
        method: 'DELETE'
      });

      // Reload events after deletion
      await loadEvents();
    } catch (err) {
      console.error('Error deleting event:', err);
      setError(formatAdminError(err));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Auto-load events when component becomes active
   */
  useEffect(() => {
    if (isActive && events.length === 0) {
      loadEvents();
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
                <span>📝</span>
                <h2 className="text-xl font-bold text-gray-800">{tStatic('common:auto.frontend.k980e58ee86cc')}</h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadEvents}
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
        {loading && events.length === 0 && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{tStatic('common:auto.frontend.kf691a435113c')}</p>
          </div>
        )}

        {/* Event List */}
        {!loading && events.length > 0 && (
          <div className="space-y-4">
            <div className="grid gap-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{
                            backgroundColor: event.color || '#3b82f6',
                          }}
                        />
                        <h3 className="font-medium text-gray-900">{event.title}</h3>
                        {event.isAllDay && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {tStatic('common:auto.frontend.k9cd859950bbb')}</span>
                        )}
                      </div>

                      <div className="space-y-1 text-sm text-gray-600">
                        <p>📅 {formatDate(event.startDate)}</p>
                        {event.endDate && (
                          <p>🏁 {formatDate(event.endDate)}</p>
                        )}
                        <p>{tStatic('common:auto.frontend.k3ec1473cd6ec')}{event.calendar?.name}</p>
                        <p>{tStatic('common:auto.frontend.kfeb05e51c9e5')}{event.createdBy?.firstName} {event.createdBy?.lastName} ({event.createdBy?.username})</p>
                        {event.description && (
                          <p className="text-xs text-gray-500 mt-2">{event.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {tStatic('common:auto.frontend.kd789a1e992ad')}{event.id}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteEvent(event.id)}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        {tStatic('common:auto.frontend.kf6fdbe48dc54')}</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && events.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">📝</div>
            <p className="text-gray-600 mb-4">{tStatic('common:auto.frontend.ka48cbba615f8')}</p>
            <Button
              variant="primary"
              onClick={loadEvents}
              themeColor={themeColor}
            >
              {tStatic('common:auto.frontend.k56e3badc4e6c')}</Button>
          </div>
        )}
      </Card>
    </div>
  );
};
