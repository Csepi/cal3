/**
 * ReservationListTable component for displaying reservation data
 *
 * This component provides a comprehensive table interface for viewing reservations
 * with features like sorting, status indicators, and action buttons.
 * It uses the modular UI components and theme system.
 */

import React from 'react';
import { Card, CardHeader, Button } from '../ui';
import type {
  ReservationCustomerInfo,
  ReservationResource,
  ReservationUserSummary,
} from '../../types/reservation';

export interface Reservation {
  id: number;
  startTime: string;
  endTime: string;
  quantity: number;
  status: string;
  customerInfo?: ReservationCustomerInfo;
  notes?: string;
  resource?: ReservationResource;
  createdBy?: ReservationUserSummary;
}

export interface ReservationListTableProps {
  /** Array of reservations to display */
  reservations: Reservation[];
  /** Function to edit a reservation */
  onEditReservation: (reservation: Reservation) => void;
  /** Function to delete a reservation */
  onDeleteReservation: (reservation: Reservation) => void;
  /** Function to create a new reservation */
  onCreateReservation: () => void;
  /** Function to refresh the data */
  onRefresh: () => void;
  /** Current theme color */
  themeColor: string;
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string | null;
}

/**
 * Status configuration for reservations
 */
const STATUS_CONFIG = {
  pending: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: '⏳',
    label: 'Pending'
  },
  confirmed: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: '✅',
    label: 'Confirmed'
  },
  cancelled: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: '❌',
    label: 'Cancelled'
  },
  completed: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: '🏁',
    label: 'Completed'
  },
};

/**
 * Comprehensive table component for reservation management
 */
export const ReservationListTable: React.FC<ReservationListTableProps> = ({
  reservations,
  onEditReservation,
  onDeleteReservation,
  onCreateReservation,
  onRefresh,
  themeColor,
  loading = false,
  error
}) => {
  /**
   * Format date and time for display
   */
  const formatDateTime = (dateTimeString: string): { date: string; time: string } => {
    const dateTime = new Date(dateTimeString);
    return {
      date: dateTime.toLocaleDateString(),
      time: dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  /**
   * Get status configuration for a reservation
   */
  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  };

  /**
   * Calculate duration between start and end times
   */
  const calculateDuration = (startTime: string, endTime: string): string => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    const durationHours = Math.round(durationMs / (1000 * 60 * 60) * 10) / 10;

    if (durationHours < 24) {
      return `${durationHours}h`;
    } else {
      const days = Math.floor(durationHours / 24);
      const remainingHours = Math.round((durationHours % 24) * 10) / 10;
      return `${days}d ${remainingHours}h`;
    }
  };

  /**
   * Handle reservation deletion with confirmation
   */
  const handleDelete = (reservation: Reservation) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the reservation for ${reservation.resource?.name || 'Unknown Resource'}? This action cannot be undone.`
    );

    if (confirmDelete) {
      onDeleteReservation(reservation);
    }
  };

  return (
    <Card
      themeColor={themeColor}
      padding="lg"
      header={
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span>📋</span>
              <h3 className="text-lg font-semibold text-gray-800">Reservations</h3>
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
                {reservations.length} items
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                loading={loading}
                themeColor={themeColor}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                }
              >
                Refresh
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={onCreateReservation}
                themeColor={themeColor}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                }
              >
                New Reservation
              </Button>
            </div>
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
          <p className="text-gray-600">Loading reservations...</p>
        </div>
      )}

      {/* Table */}
      {reservations.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resource
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qty
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reservations.map((reservation) => {
                const startDateTime = formatDateTime(reservation.startTime);
                const endDateTime = formatDateTime(reservation.endTime);
                const statusConfig = getStatusConfig(reservation.status);
                const duration = calculateDuration(reservation.startTime, reservation.endTime);
                const isSameDay = startDateTime.date === endDateTime.date;

                return (
                  <tr key={reservation.id} className="hover:bg-gray-50">
                    {/* Resource */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {reservation.resource?.name || 'Unknown Resource'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {reservation.resource?.resourceType?.name || 'Unknown Type'}
                        </div>
                      </div>
                    </td>

                    {/* Date & Time */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {isSameDay ? (
                          <div>
                            <div className="font-medium">{startDateTime.date}</div>
                            <div>{startDateTime.time} - {endDateTime.time}</div>
                          </div>
                        ) : (
                          <div>
                            <div>{startDateTime.date} {startDateTime.time}</div>
                            <div className="text-gray-500">to {endDateTime.date} {endDateTime.time}</div>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Duration */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{duration}</span>
                    </td>

                    {/* Customer */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {reservation.customerInfo?.name || 'No name'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {reservation.customerInfo?.email || reservation.customerInfo?.phone || 'No contact'}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                        <span className="mr-1">{statusConfig.icon}</span>
                        {statusConfig.label}
                      </span>
                    </td>

                    {/* Quantity */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{reservation.quantity}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditReservation(reservation)}
                          themeColor={themeColor}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(reservation)}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : !loading ? (
        /* Empty State */
        <div className="text-center py-12">
          <div className="text-gray-400 text-4xl mb-4">📅</div>
          <p className="text-gray-600 mb-4">No reservations found</p>
          <Button
            variant="primary"
            onClick={onCreateReservation}
            themeColor={themeColor}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          >
            Create Your First Reservation
          </Button>
        </div>
      ) : null}

      {/* Summary Footer */}
      {reservations.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>
                  {reservations.filter(r => r.status === 'confirmed').length} Confirmed
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span>
                  {reservations.filter(r => r.status === 'pending').length} Pending
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>
                  {reservations.filter(r => r.status === 'cancelled').length} Cancelled
                </span>
              </div>
            </div>
            <div>
              <span>Total: {reservations.length} reservations</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
