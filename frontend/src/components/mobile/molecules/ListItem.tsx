/**
 * ListItem - Molecule Component
 *
 * Mobile-optimized list item for tables and lists
 * Features:
 * - Touch-friendly (48px+ height)
 * - Icon support
 * - Badge/status indicators
 * - Action buttons
 * - Swipe actions
 */

import React from 'react';
import { TouchableArea } from '../atoms/TouchableArea';
import { Icon } from '../atoms/Icon';
import { Badge } from '../atoms/Badge';

interface ListItemAction {
  icon: string;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'danger' | 'secondary';
}

interface ListItemProps {
  title: string;
  subtitle?: string;
  icon?: string;
  badge?: string | number;
  badgeVariant?: 'primary' | 'success' | 'warning' | 'danger';
  onClick?: () => void;
  actions?: ListItemAction[];
  showChevron?: boolean;
  className?: string;
}

export const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  icon,
  badge,
  badgeVariant = 'primary',
  onClick,
  actions = [],
  showChevron = false,
  className = '',
}) => {
  return (
    <div className={`border-b border-gray-200 last:border-b-0 ${className}`}>
      <div className="flex items-center gap-3 py-3 px-4 min-h-[48px]">
        {/* Icon */}
        {icon && (
          <div className="shrink-0">
            <Icon icon={icon} size="md" />
          </div>
        )}

        {/* Content */}
        <TouchableArea
          onClick={onClick}
          className="flex-1 min-w-0"
          minSize="sm"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="font-medium text-gray-900 truncate">{title}</div>
              {subtitle && (
                <div className="text-sm text-gray-500 truncate">{subtitle}</div>
              )}
            </div>

            {/* Badge */}
            {badge !== undefined && (
              <Badge variant={badgeVariant} size="sm">
                {badge}
              </Badge>
            )}

            {/* Chevron */}
            {showChevron && onClick && (
              <Icon icon="›" size="md" className="text-gray-400" />
            )}
          </div>
        </TouchableArea>

        {/* Actions */}
        {actions.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            {actions.map((action, index) => (
              <TouchableArea
                key={index}
                onClick={action.onClick}
                className={`
                  p-2 rounded-lg
                  ${action.variant === 'danger'
                    ? 'text-red-600 hover:bg-red-50'
                    : action.variant === 'primary'
                    ? 'text-blue-600 hover:bg-blue-50'
                    : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
                minSize="sm"
                ariaLabel={action.label}
              >
                <Icon icon={action.icon} size="sm" />
              </TouchableArea>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
