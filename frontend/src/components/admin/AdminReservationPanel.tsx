/**
 * AdminReservationPanel component for managing reservations
 *
 * This component provides reservation management functionality for administrators
 * including viewing all reservations, user relationships, and reservation deletion.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, Button } from '../ui';
import { loadAdminData, formatAdminError, adminApiCall } from './adminApiService';
import type { Reservation } from './types';

import { tStatic } from '../../i18n';

export interface AdminReservationPanelProps {
  /** Current theme color for styling */
  themeColor?: string;
  /** Whether the panel is currently active/visible */
  isActive?: boolean;
}

/**
 * Reservation management panel for administrators
 */
export const AdminReservationPanel: React.FC<AdminReservationPanelProps> = ({
  themeColor,
  isActive = false
}) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  /**
   * Load all reservations from the API
   */
  const loadReservations = async () => {
    try {
      setLoading(true);
      setError('');

      const reservationsData = await loadAdminData<Reservation[]>('/admin/reservations');
      setReservations(reservationsData);

    } catch (err) {
      console.error('Error loading reservations:', err);
      setError(formatAdminError(err));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete a reservation
   */
  const deleteReservation = async (reservationId: number) => {
    if (!confirm(tStatic('common:auto.frontend.k5682227d5123'))) {
      return;
    }

    try {
      setLoading(true);
      await adminApiCall({
        endpoint: `/admin/reservations/${reservationId}`,
        method: 'DELETE',
      });

      // Reload reservations after deletion
      await loadReservations();
    } catch (err) {
      console.error('Error deleting reservation:', err);
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Auto-load reservations when component becomes active
   */
  useEffect(() => {
    if (isActive && reservations.length === 0) {
      loadReservations();
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
                <span>🏢</span>
                <h2 className="text-xl font-bold text-gray-800">{tStatic('common:auto.frontend.k64340294b9cf')}</h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadReservations}
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
        {loading && reservations.length === 0 && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{tStatic('common:auto.frontend.k44b91203c407')}</p>
          </div>
        )}

        {/* Reservation List */}
        {!loading && reservations.length > 0 && (
          <div className="space-y-4">
            <div className="grid gap-4">
              {reservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium text-gray-900">{reservation.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          reservation.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : reservation.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {reservation.status}
                        </span>
                      </div>

                      <div className="space-y-1 text-sm text-gray-600">
                        <p>{tStatic('common:auto.frontend.k839a7ffb2057')}{reservation.resource?.name}</p>
                        <p>{tStatic('common:auto.frontend.k4a01fb80d26c')}{reservation.resource?.resourceType?.name}</p>
                        <p>{tStatic('common:auto.frontend.k4f5010ded490')}{formatDate(reservation.startTime)}</p>
                        <p>{tStatic('common:auto.frontend.ka64203797f54')}{formatDate(reservation.endTime)}</p>
                        <p>{tStatic('common:auto.frontend.kfeb05e51c9e5')}{reservation.createdBy?.firstName} {reservation.createdBy?.lastName} ({reservation.createdBy?.username})</p>
                        {reservation.description && (
                          <p className="text-xs text-gray-500 mt-2">{reservation.description}</p>
                        )}
                        {reservation.isRecurring && (
                          <div className="flex items-center space-x-2 mt-2">
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                              {tStatic('common:auto.frontend.kaf81638fa1e4')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {tStatic('common:auto.frontend.kd789a1e992ad')}{reservation.id}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteReservation(reservation.id)}
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
        {!loading && reservations.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">🏢</div>
            <p className="text-gray-600 mb-4">{tStatic('common:auto.frontend.kf321e81ab1b2')}</p>
            <Button
              variant="primary"
              onClick={loadReservations}
              themeColor={themeColor}
            >
              {tStatic('common:auto.frontend.k56e3badc4e6c')}</Button>
          </div>
        )}
      </Card>
    </div>
  );
};
