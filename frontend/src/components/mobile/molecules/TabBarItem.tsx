// @ts-nocheck
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
  const withAlpha = (color: string, alpha: number) => {
    if (!color.startsWith('#')) return color;
    const hex = color.replace('#', '');
    const normalized = hex.length === 3
      ? hex.split('').map((char) => char + char).join('')
      : hex;
    const bigint = parseInt(normalized, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const activeSurface = withAlpha(themeColor, 0.12);
  const activeBorder = withAlpha(themeColor, 0.28);
  const activeGlow = withAlpha(themeColor, 0.2);

  return (
    <TouchableArea
      onClick={onClick}
      ariaLabel={label}
      className="flex-1 px-1 py-1 relative"
      minSize="lg"
    >
      <div
        className="relative flex w-full flex-col items-center gap-1 rounded-2xl border transition-all duration-200 ease-out bg-white/90"
        style={{
          background: isActive
            ? `linear-gradient(135deg, ${activeSurface}, ${withAlpha(themeColor, 0.06)})`
            : 'transparent',
          borderColor: isActive ? activeBorder : 'rgba(148, 163, 184, 0.25)',
          boxShadow: isActive ? `0 14px 32px ${activeGlow}` : 'none',
        }}
      >
        {/* Badge or Dot */}
        {(badge || showDot) && (
          <div className="absolute -top-1 -right-1">
            {showDot ? (
              <Badge variant="danger" dot size="sm" />
            ) : (
              <Badge variant="danger" size="sm">
                {badge}
              </Badge>
            )}
          </div>
        )}

        <div
          className="mt-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 shadow-sm transition-all duration-200"
          style={{
            color: isActive ? themeColor : '#475569',
            border: `1px solid ${isActive ? activeBorder : 'rgba(226, 232, 240, 0.9)'}`,
          }}
        >
          <Icon icon={icon} size="md" />
        </div>

        <span
          className={`text-[11px] font-semibold tracking-wide transition-all duration-200 mb-2
            ${isActive ? 'opacity-100' : 'opacity-70 text-gray-600'}
          `}
          style={{
            color: isActive ? themeColor : undefined,
          }}
        >
          {label}
        </span>
      </div>
    </TouchableArea>
  );
};

