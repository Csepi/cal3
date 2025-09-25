import React from 'react';
import { getThemeConfig } from '../../constants';

/**
 * Reusable Card component with theme support and flexible content areas
 *
 * This component provides a consistent card interface across the application
 * with proper theme integration, optional header/footer sections, and flexible content layout.
 */

export interface CardProps {
  /** Card content */
  children: React.ReactNode;
  /** Optional card header content */
  header?: React.ReactNode;
  /** Optional card footer content */
  footer?: React.ReactNode;
  /** Theme color for styling */
  themeColor?: string;
  /** Additional CSS classes */
  className?: string;
  /** Card padding variant */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Whether card should have hover effects */
  hoverable?: boolean;
  /** Whether card should have elevated shadow */
  elevated?: boolean;
  /** Card border variant */
  border?: 'none' | 'light' | 'themed';
  /** Background variant */
  background?: 'white' | 'light' | 'gradient';
  /** Click handler for clickable cards */
  onClick?: () => void;
}

/**
 * Flexible Card component that provides consistent styling and theming
 * for content containers throughout the application.
 */
export const Card: React.FC<CardProps> = ({
  children,
  header,
  footer,
  themeColor,
  className = '',
  padding = 'md',
  hoverable = false,
  elevated = false,
  border = 'light',
  background = 'white',
  onClick
}) => {
  // Get theme configuration
  const themeConfig = themeColor ? getThemeConfig(themeColor) : null;

  // Base card classes
  const baseClasses = [
    'rounded-xl',
    'transition-all',
    'duration-300',
    onClick && 'cursor-pointer'
  ].filter(Boolean).join(' ');

  // Padding classes
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  // Background classes with theme support
  const getBackgroundClasses = () => {
    if (background === 'gradient' && themeConfig) {
      return `bg-gradient-to-br ${themeConfig.gradient.background}`;
    } else if (background === 'light' && themeConfig) {
      return `bg-${themeConfig.light}`;
    }
    return 'bg-white';
  };

  // Border classes with theme support
  const getBorderClasses = () => {
    if (border === 'none') return '';
    if (border === 'themed' && themeConfig) {
      return `border border-${themeConfig.border}`;
    }
    return 'border border-gray-200';
  };

  // Shadow classes
  const getShadowClasses = () => {
    if (elevated) return 'shadow-xl';
    if (hoverable) return 'shadow-md hover:shadow-lg';
    return 'shadow-sm';
  };

  // Hover effects
  const getHoverClasses = () => {
    if (!hoverable) return '';
    if (themeConfig && background === 'white') {
      return `hover:bg-${themeConfig.light}`;
    }
    return 'hover:bg-gray-50';
  };

  // Combine all classes
  const cardClasses = [
    baseClasses,
    paddingClasses[padding],
    getBackgroundClasses(),
    getBorderClasses(),
    getShadowClasses(),
    getHoverClasses(),
    className
  ].join(' ');

  // Header classes with theme support
  const getHeaderClasses = () => {
    const baseHeader = 'border-b mb-4 pb-3';
    if (themeConfig) {
      return `${baseHeader} border-${themeConfig.border}`;
    }
    return `${baseHeader} border-gray-200`;
  };

  // Footer classes with theme support
  const getFooterClasses = () => {
    const baseFooter = 'border-t mt-4 pt-3';
    if (themeConfig) {
      return `${baseFooter} border-${themeConfig.border}`;
    }
    return `${baseFooter} border-gray-200`;
  };

  return (
    <div className={cardClasses} onClick={onClick}>
      {/* Header section */}
      {header && (
        <div className={getHeaderClasses()}>
          {header}
        </div>
      )}

      {/* Main content */}
      <div className={!header && !footer ? '' : ''}>
        {children}
      </div>

      {/* Footer section */}
      {footer && (
        <div className={getFooterClasses()}>
          {footer}
        </div>
      )}
    </div>
  );
};

/**
 * Card Header component for consistent header styling
 */
export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => (
  <div className={`text-lg font-semibold text-gray-800 ${className}`}>
    {children}
  </div>
);

/**
 * Card Footer component for consistent footer styling
 */
export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => (
  <div className={`flex items-center justify-between ${className}`}>
    {children}
  </div>
);