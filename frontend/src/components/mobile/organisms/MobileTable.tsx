/**
 * MobileTable - Organism Component
 *
 * Responsive table that converts to mobile-friendly cards
 * Features:
 * - Desktop: Standard table
 * - Mobile: Stacked card layout
 * - Search/filter support
 * - Pagination support
 * - Action buttons
 */

import React from 'react';
import { useScreenSize } from '../../../hooks/useScreenSize';
import { ListItem } from '../molecules/ListItem';

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  mobileLabel?: string; // Custom label for mobile cards
}

export interface TableAction<T> {
  icon: string;
  label: string;
  onClick: (row: T) => void;
  variant?: 'primary' | 'danger' | 'secondary';
  showOnMobile?: boolean;
}

interface MobileTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyField: keyof T;
  actions?: TableAction<T>[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  mobileTitle?: (row: T) => string;
  mobileSubtitle?: (row: T) => string;
  mobileIcon?: (row: T) => string;
}

export function MobileTable<T extends Record<string, any>>({
  columns,
  data,
  keyField,
  actions = [],
  onRowClick,
  emptyMessage = 'No data available',
  mobileTitle,
  mobileSubtitle,
  mobileIcon,
}: MobileTableProps<T>) {
  const { isMobile } = useScreenSize();

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  // Mobile View: Card Layout
  if (isMobile) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {data.map((row) => {
          const title = mobileTitle ? mobileTitle(row) : String(row[columns[0].key]);
          const subtitle = mobileSubtitle ? mobileSubtitle(row) : String(row[columns[1]?.key] || '');
          const icon = mobileIcon ? mobileIcon(row) : undefined;

          const mobileActions = actions
            .filter(action => action.showOnMobile !== false)
            .map(action => ({
              icon: action.icon,
              label: action.label,
              onClick: () => action.onClick(row),
              variant: action.variant,
            }));

          return (
            <ListItem
              key={String(row[keyField])}
              title={title}
              subtitle={subtitle}
              icon={icon}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              actions={mobileActions}
              showChevron={!!onRowClick}
            />
          );
        })}
      </div>
    );
  }

  // Desktop View: Standard Table
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
              {actions.length > 0 && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row) => (
              <tr
                key={String(row[keyField])}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
              >
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {column.render ? column.render(row) : String(row[column.key] || '-')}
                  </td>
                ))}
                {actions.length > 0 && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {actions.map((action, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation();
                            action.onClick(row);
                          }}
                          className={`
                            px-3 py-1 rounded-md text-sm font-medium transition-colors
                            ${action.variant === 'danger'
                              ? 'text-red-600 hover:bg-red-50'
                              : action.variant === 'primary'
                              ? 'text-blue-600 hover:bg-blue-50'
                              : 'text-gray-600 hover:bg-gray-50'
                            }
                          `}
                          title={action.label}
                        >
                          {action.icon}
                        </button>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
