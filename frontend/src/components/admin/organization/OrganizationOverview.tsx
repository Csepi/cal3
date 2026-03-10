/**
 * OrganizationOverview - Display organization details and statistics
 */

import React from 'react';
import type { Organisation } from '../types';
import { getThemeConfig } from '../../../constants/theme';

import { tStatic } from '../../../i18n';

export interface OrganizationOverviewProps {
  organization: Organisation | null;
  adminCount?: number;
  userCount?: number;
  calendarCount?: number;
  loading?: boolean;
  themeColor?: string;
}

export const OrganizationOverview: React.FC<OrganizationOverviewProps> = ({
  organization,
  adminCount = 0,
  userCount = 0,
  calendarCount = 0,
  loading = false,
  themeColor = '#3b82f6',
}) => {
  const theme = getThemeConfig(themeColor);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">{tStatic('common:auto.frontend.k9f10817cfcbd')}</span>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-600">{tStatic('common:auto.frontend.k6190ce111273')}</p>
      </div>
    );
  }

  const totalMembers = adminCount + userCount;
  const createdDate = organization.createdAt
    ? new Date(organization.createdAt).toLocaleDateString()
    : 'N/A';
  const updatedDate = organization.updatedAt
    ? new Date(organization.updatedAt).toLocaleDateString()
    : 'N/A';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`bg-gradient-to-r ${theme.gradient.header} rounded-lg p-6 text-white`}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">{organization.name}</h2>
            <p className="text-white/90">
              {organization.description || <span className="italic">{tStatic('common:auto.frontend.k2145e21d6063')}</span>}
            </p>
          </div>
          <div className="flex items-center">
            {organization.isActive ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500 text-white">
                {tStatic('common:auto.frontend.kdefe27899700')}</span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-500 text-white">
                {tStatic('common:auto.frontend.kf5455820508c')}</span>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Members Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">{tStatic('common:auto.frontend.k597c15324d4f')}</span>
            <span className="text-2xl">👥</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{totalMembers}</div>
          <div className="text-xs text-gray-500 mt-2">
            {adminCount} {tStatic('common:auto.frontend.kd033e22ae348')}{adminCount !== 1 ? 's' : ''} • {userCount} {tStatic('common:auto.frontend.k12dea96fec20')}{userCount !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Calendars Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">{tStatic('common:auto.frontend.k9444501818e6')}</span>
            <span className="text-2xl">📅</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{calendarCount}</div>
          <div className="text-xs text-gray-500 mt-2">
            {tStatic('common:auto.frontend.kfd42894a5152')}</div>
        </div>

        {/* Status Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">{tStatic('common:auto.frontend.k986c63d3b197')}</span>
            <span className="text-2xl">🏢</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">#{organization.id}</div>
          <div className="text-xs text-gray-500 mt-2">
            {organization.isActive ? 'Currently active' : 'Currently inactive'}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{tStatic('common:auto.frontend.k6553c6549b91')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">{tStatic('common:auto.frontend.k479fa82ac762')}</label>
            <p className="text-gray-900">{createdDate}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">{tStatic('common:auto.frontend.k66f3e18075fb')}</label>
            <p className="text-gray-900">{updatedDate}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">{tStatic('common:auto.frontend.k1458ffedd0eb')}</label>
            <p className="text-gray-900 font-medium">{organization.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">{tStatic('common:auto.frontend.kbae7d5be7082')}</label>
            <p className="text-gray-900">
              {organization.isActive ? (
                <span className="text-green-600 font-medium">{tStatic('common:auto.frontend.ka733b809d2f1')}</span>
              ) : (
                <span className="text-gray-600 font-medium">{tStatic('common:auto.frontend.k09af574c7f20')}</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationOverview;
