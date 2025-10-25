/**
 * Icon - Atomic Component
 *
 * Unified icon system with consistent sizing
 * Supports text icons (emoji) and SVG icons
 */

import React from 'react';

interface IconProps {
  icon: string | React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
}

export const Icon: React.FC<IconProps> = ({
  icon,
  size = 'md',
  color,
  className = '',
}) => {
  const sizeClasses = {
    xs: 'text-xs w-4 h-4',
    sm: 'text-sm w-5 h-5',
    md: 'text-base w-6 h-6',
    lg: 'text-lg w-8 h-8',
    xl: 'text-2xl w-10 h-10',
  };

  const colorClass = color ? `text-${color}` : '';

  if (typeof icon === 'string') {
    // Emoji or text icon
    return (
      <span
        className={`${sizeClasses[size]} ${colorClass} ${className} inline-flex items-center justify-center`}
        aria-hidden="true"
      >
        {icon}
      </span>
    );
  }

  // SVG or component icon
  return (
    <div
      className={`${sizeClasses[size]} ${colorClass} ${className} inline-flex items-center justify-center`}
      aria-hidden="true"
    >
      {icon}
    </div>
  );
};
