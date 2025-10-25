/**
 * Badge - Atomic Component
 *
 * Notification badges, status indicators, counts
 * Reusable across tabs, lists, cards
 */

import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  dot = false,
  className = '',
}) => {
  const variantClasses = {
    primary: 'bg-blue-500 text-white',
    secondary: 'bg-gray-500 text-white',
    success: 'bg-green-500 text-white',
    warning: 'bg-yellow-500 text-white',
    danger: 'bg-red-500 text-white',
    info: 'bg-cyan-500 text-white',
  };

  const sizeClasses = dot
    ? {
        sm: 'w-2 h-2',
        md: 'w-2.5 h-2.5',
        lg: 'w-3 h-3',
      }
    : {
        sm: 'px-1.5 py-0.5 text-xs',
        md: 'px-2 py-1 text-sm',
        lg: 'px-2.5 py-1.5 text-base',
      };

  if (dot) {
    return (
      <span
        className={`
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          rounded-full
          inline-block
          ${className}
        `}
        aria-hidden="true"
      />
    );
  }

  return (
    <span
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        rounded-full
        font-medium
        inline-flex items-center justify-center
        min-w-[20px]
        ${className}
      `}
    >
      {children}
    </span>
  );
};
