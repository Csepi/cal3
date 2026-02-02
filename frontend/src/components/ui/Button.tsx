import React from 'react';
import { getThemeConfig } from '../../constants';

/**
 * Reusable Button component with theme support and multiple variants
 *
 * This component provides a consistent button interface across the application
 * with proper theme integration, accessibility features, and multiple styling variants.
 */

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button content */
  children?: React.ReactNode;
  /** Visual variant of the button */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  /** Size of the button */
  size?: 'sm' | 'md' | 'lg';
  /** Whether the button is in loading state */
  loading?: boolean;
  /** Theme color for styling */
  themeColor?: string;
  /** Whether button should take full width */
  fullWidth?: boolean;
  /** Icon to display before button text */
  icon?: React.ReactNode;
}

/**
 * Versatile Button component that adapts to theme colors and provides
 * multiple variants for different use cases throughout the application.
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  themeColor,
  fullWidth = false,
  icon,
  disabled,
  className = '',
  ...props
}) => {
  // Get theme configuration
  const themeConfig = themeColor ? getThemeConfig(themeColor) : null;

  // Base button classes
  const baseClasses = [
    'inline-flex',
    'items-center',
    'justify-center',
    'font-medium',
    'rounded-lg',
    'transition-all',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    fullWidth && 'w-full'
  ].filter(Boolean).join(' ');

  // Size-specific classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  // Variant-specific classes with theme support
  const getVariantClasses = () => {
    if (themeConfig) {
      // Use theme colors when available
      switch (variant) {
        case 'primary':
          return `${themeConfig.button} text-white ${themeConfig.focus} shadow-md hover:shadow-lg`;
        case 'secondary':
          return `bg-${themeConfig.light} text-${themeConfig.text} border border-${themeConfig.border} hover:bg-${themeConfig.hover} focus:ring-${themeConfig.primary}-500`;
        case 'outline':
          return `border-2 border-${themeConfig.border} text-${themeConfig.text} bg-transparent hover:bg-${themeConfig.light} ${themeConfig.focus}`;
        case 'ghost':
          return `text-${themeConfig.text} bg-transparent hover:bg-${themeConfig.light} ${themeConfig.focus}`;
        case 'danger':
          return 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500 shadow-md hover:shadow-lg';
        default:
          return themeConfig.button + ' text-white shadow-md hover:shadow-lg';
      }
    } else {
      // Fallback to default styling without theme
      switch (variant) {
        case 'primary':
          return 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500 shadow-md hover:shadow-lg';
        case 'secondary':
          return 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 focus:ring-gray-500';
        case 'outline':
          return 'border-2 border-gray-300 text-gray-700 bg-transparent hover:bg-gray-50 focus:ring-gray-500';
        case 'ghost':
          return 'text-gray-700 bg-transparent hover:bg-gray-100 focus:ring-gray-500';
        case 'danger':
          return 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500 shadow-md hover:shadow-lg';
        default:
          return 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500 shadow-md hover:shadow-lg';
      }
    }
  };

  // Combine all classes
  const buttonClasses = [
    baseClasses,
    sizeClasses[size],
    getVariantClasses(),
    className
  ].join(' ');

  return (
    <button
      className={buttonClasses}
      disabled={disabled || loading}
      {...props}
    >
      {/* Loading spinner */}
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}

      {/* Icon */}
      {icon && !loading && (
        <span className="mr-2">{icon}</span>
      )}

      {/* Button content */}
      {children}
    </button>
  );
};
