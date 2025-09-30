/**
 * Badge component for displaying status, roles, and labels
 *
 * A reusable badge component that supports multiple variants and sizes,
 * following the existing UI component patterns in the application.
 */

import React from 'react';

export interface BadgeProps {
  /** Content to display in the badge */
  children: React.ReactNode;
  /** Visual variant of the badge */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  /** Size of the badge */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
  /** Optional icon to display before text */
  icon?: React.ReactNode;
}

const variantClasses = {
  default: 'bg-gray-100 text-gray-800 border border-gray-300',
  primary: 'bg-blue-100 text-blue-800 border border-blue-300',
  success: 'bg-green-100 text-green-800 border border-green-300',
  warning: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
  danger: 'bg-red-100 text-red-800 border border-red-300',
  info: 'bg-cyan-100 text-cyan-800 border border-cyan-300',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

/**
 * Badge component for displaying compact labels and status indicators
 */
export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
  icon
}) => {
  const variantClass = variantClasses[variant];
  const sizeClass = sizeClasses[size];

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full whitespace-nowrap ${variantClass} ${sizeClass} ${className}`}
    >
      {icon && <span className="inline-flex items-center">{icon}</span>}
      {children}
    </span>
  );
};

export default Badge;