/**
 * OrganizationList - Display and manage organization list
 */

import React from 'react';
import { Button } from '../../ui';
import type { Organisation } from '../types';
import { getThemeConfig } from '../../../constants/theme';

import { tStatic } from '../../../i18n';

export interface OrganizationListProps {
  organizations: Organisation[];
  onSelectOrganization: (orgId: number) => void;
  onDeleteOrganization: (orgId: number) => void;
  selectedOrgId: number | null;
  loading?: boolean;
  themeColor?: string;
}

export const OrganizationList: React.FC<OrganizationListProps> = ({
  organizations,
  onSelectOrganization,
  onDeleteOrganization,
  selectedOrgId,
  loading = false,
  themeColor = '#3b82f6',
}) => {
  const theme = getThemeConfig(themeColor);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">{tStatic('common:auto.frontend.k498bb9f4af5e')}</span>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-600">{tStatic('common:auto.frontend.kd94fae5a2d15')}</p>
        <p className="text-sm text-gray-500 mt-1">{tStatic('common:auto.frontend.k0322c180b02f')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">{tStatic('common:auto.frontend.k709a23220f2c')}</th>
            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">{tStatic('common:auto.frontend.k55f8ebc805e6')}</th>
            <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700">{tStatic('common:auto.frontend.k1cb449c11266')}</th>
            <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700">{tStatic('common:auto.frontend.k9444501818e6')}</th>
            <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700">{tStatic('common:auto.frontend.kbae7d5be7082')}</th>
            <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700">{tStatic('common:auto.frontend.kc3cd636a585b')}</th>
          </tr>
        </thead>
        <tbody>
          {organizations.map((org) => {
            const isSelected = org.id === selectedOrgId;
            const rowClass = isSelected
              ? `bg-${theme.primary}-50 border-l-4 border-${theme.primary}-500`
              : 'hover:bg-gray-50';

            return (
              <tr
                key={org.id}
                className={`border-b border-gray-200 cursor-pointer transition-colors ${rowClass}`}
                onClick={() => onSelectOrganization(org.id)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${org.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="font-medium text-gray-900">{org.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {org.description || <span className="italic text-gray-400">{tStatic('common:auto.frontend.kf354c94fcf63')}</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {(org.adminCount || 0) + (org.userCount || 0)}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {org.calendarCount || 0}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {org.isActive ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {tStatic('common:auto.frontend.ka733b809d2f1')}</span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {tStatic('common:auto.frontend.k09af574c7f20')}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center space-x-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      onClick={() => onSelectOrganization(org.id)}
                      className="text-xs px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      {tStatic('common:auto.frontend.k69bd4ef9fbd0')}</Button>
                    <Button
                      onClick={() => onDeleteOrganization(org.id)}
                      className="text-xs px-2 py-1 bg-red-500 hover:bg-red-600 text-white"
                    >
                      {tStatic('common:auto.frontend.kf6fdbe48dc54')}</Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default OrganizationList;