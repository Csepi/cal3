/**
 * ReservationFilterPanel component for filtering reservations
 *
 * This component provides a comprehensive filtering interface for reservations,
 * allowing users to filter by status, resource type, organization, date range,
 * and specific resources. It uses the modular UI components and theme system.
 */

import React from 'react';
import { Card, CardHeader, Button, Input } from '../ui';
import type {
  ReservationOrganization,
  ReservationResource,
  ReservationResourceType,
} from '../../types/reservation';

export interface ReservationFilters {
  status: string;
  resourceType: string;
  organization: string;
  dateFrom: string;
  dateTo: string;
  resourceId: string;
}

export interface ReservationFilterPanelProps {
  /** Current filter values */
  filters: ReservationFilters;
  /** Function to update filters */
  onFiltersChange: (filters: ReservationFilters) => void;
  /** Available resource types for filtering */
  resourceTypes: ReservationResourceType[];
  /** Available organizations for filtering */
  organizations: ReservationOrganization[];
  /** Available resources for filtering */
  resources: ReservationResource[];
  /** Current theme color */
  themeColor: string;
  /** Loading state */
  loading?: boolean;
  /** Function to clear all filters */
  onClearFilters: () => void;
  /** Function to refresh data */
  onRefresh: () => void;
}

/**
 * Status options for reservation filtering
 */
const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' }
];

/**
 * Comprehensive filtering panel for reservation management
 */
export const ReservationFilterPanel: React.FC<ReservationFilterPanelProps> = ({
  filters,
  onFiltersChange,
  resourceTypes,
  organizations,
  resources,
  themeColor,
  loading = false,
  onClearFilters,
  onRefresh
}) => {
  /**
   * Handle individual filter changes
   */
  const handleFilterChange = (key: keyof ReservationFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  /**
   * Get active filter count for display
   */
  const getActiveFilterCount = (): number => {
    return Object.values(filters).filter(value => value !== '').length;
  };

  return (
    <Card
      themeColor={themeColor}
      padding="lg"
      header={
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span>🔍</span>
              <h3 className="text-lg font-semibold text-gray-800">Filter Reservations</h3>
              {hasActiveFilters && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                  {getActiveFilterCount()} active
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
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
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearFilters}
                  themeColor={themeColor}
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      }
    >
      <div className="space-y-6">
        {/* Status and Resource Type Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Resource Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resource Type
            </label>
            <select
              value={filters.resourceType}
              onChange={(e) => handleFilterChange('resourceType', e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">All Resource Types</option>
              {resourceTypes.map((type) => (
                <option key={type.id} value={type.id.toString()}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Organization and Resource Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Organization Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organization
            </label>
            <select
              value={filters.organization}
              onChange={(e) => handleFilterChange('organization', e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">All Organizations</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id.toString()}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          {/* Resource Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specific Resource
            </label>
            <select
              value={filters.resourceId}
              onChange={(e) => handleFilterChange('resourceId', e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">All Resources</option>
              {resources.map((resource) => (
                <option key={resource.id} value={resource.id.toString()}>
                  {resource.name} ({resource.resourceType?.name || 'Unknown Type'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Date From"
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            disabled={loading}
            themeColor={themeColor}
          />

          <Input
            label="Date To"
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            disabled={loading}
            themeColor={themeColor}
          />
        </div>

        {/* Filter Summary */}
        {hasActiveFilters && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Active Filters:</h4>
            <div className="flex flex-wrap gap-2">
              {filters.status && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Status: {STATUS_OPTIONS.find(s => s.value === filters.status)?.label}
                  <button
                    onClick={() => handleFilterChange('status', '')}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}

              {filters.resourceType && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Type: {resourceTypes.find(rt => rt.id.toString() === filters.resourceType)?.name}
                  <button
                    onClick={() => handleFilterChange('resourceType', '')}
                    className="ml-1 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              )}

              {filters.organization && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Org: {organizations.find(o => o.id.toString() === filters.organization)?.name}
                  <button
                    onClick={() => handleFilterChange('organization', '')}
                    className="ml-1 text-purple-600 hover:text-purple-800"
                  >
                    ×
                  </button>
                </span>
              )}

              {filters.resourceId && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Resource: {resources.find(r => r.id.toString() === filters.resourceId)?.name}
                  <button
                    onClick={() => handleFilterChange('resourceId', '')}
                    className="ml-1 text-orange-600 hover:text-orange-800"
                  >
                    ×
                  </button>
                </span>
              )}

              {filters.dateFrom && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  From: {filters.dateFrom}
                  <button
                    onClick={() => handleFilterChange('dateFrom', '')}
                    className="ml-1 text-gray-600 hover:text-gray-800"
                  >
                    ×
                  </button>
                </span>
              )}

              {filters.dateTo && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  To: {filters.dateTo}
                  <button
                    onClick={() => handleFilterChange('dateTo', '')}
                    className="ml-1 text-gray-600 hover:text-gray-800"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-800 mb-1">Filter Tips</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Use multiple filters to narrow down results</li>
                <li>• Date range filters are inclusive of start and end dates</li>
                <li>• Clear individual filters using the × button or clear all at once</li>
                <li>• Filters are applied automatically as you change them</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
