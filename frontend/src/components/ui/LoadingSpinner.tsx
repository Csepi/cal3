import React from 'react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-4',
} as const;

/**
 * Lightweight loading spinner.
 *
 * @example
 * ```tsx
 * <LoadingSpinner size="md" label="Loading" />
 * ```
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  label,
  className = '',
}) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <span
      className={`${sizeClasses[size]} animate-spin rounded-full border-blue-500 border-t-transparent`}
      aria-hidden="true"
    />
    {label && <span className="text-sm text-gray-600">{label}</span>}
  </div>
);
