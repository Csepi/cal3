/**
 * TabBarItem - Molecular Component
 *
 * Single tab item for bottom navigation
 * Combines: TouchableArea + Icon + Badge
 */

import React from 'react';
import { TouchableArea } from '../atoms/TouchableArea';
import { Icon } from '../atoms/Icon';
import { Badge } from '../atoms/Badge';

interface TabBarItemProps {
  icon: string | React.ReactNode;
  label: string;
  isActive?: boolean;
  badge?: number | string;
  showDot?: boolean;
  onClick: () => void;
  themeColor?: string;
}

export const TabBarItem: React.FC<TabBarItemProps> = ({
  icon,
  label,
  isActive = false,
  badge,
  showDot = false,
  onClick,
  themeColor = '#3b82f6',
}) => {
  return (
    <TouchableArea
      onClick={onClick}
      ariaLabel={label}
      className="flex-1 flex flex-col items-center justify-center py-2 relative"
      minSize="lg"
    >
      {/* Badge or Dot */}
      {(badge || showDot) && (
        <div className="absolute top-1 right-1/2 translate-x-3">
          {showDot ? (
            <Badge variant="danger" dot size="sm" />
          ) : (
            <Badge variant="danger" size="sm">
              {badge}
            </Badge>
          )}
        </div>
      )}

      {/* Icon */}
      <div
        className={`
          transition-all duration-200
          ${isActive ? 'scale-110' : 'scale-100'}
        `}
        style={{
          color: isActive ? themeColor : '#6b7280',
        }}
      >
        <Icon icon={icon} size="lg" />
      </div>

      {/* Label */}
      <span
        className={`
          text-xs font-medium mt-1 transition-all duration-200
          ${isActive ? 'opacity-100' : 'opacity-60'}
        `}
        style={{
          color: isActive ? themeColor : '#6b7280',
        }}
      >
        {label}
      </span>

      {/* Active Indicator */}
      {isActive && (
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full"
          style={{ backgroundColor: themeColor }}
        />
      )}
    </TouchableArea>
  );
};
