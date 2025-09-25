import React from 'react';
import { getThemeConfig } from '../../constants';

/**
 * Reusable Input component with theme support and validation states
 *
 * This component provides consistent form input styling across the application
 * with proper theme integration, validation states, and accessibility features.
 */

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Input label */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Helper text to display */
  helperText?: string;
  /** Theme color for styling */
  themeColor?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Icon to display in the input */
  icon?: React.ReactNode;
  /** Position of the icon */
  iconPosition?: 'left' | 'right';
  /** Input size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether input should take full width */
  fullWidth?: boolean;
}

/**
 * Versatile Input component that provides consistent styling and validation
 * states with proper theme integration.
 */
export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  themeColor,
  required = false,
  icon,
  iconPosition = 'left',
  size = 'md',
  fullWidth = true,
  className = '',
  id,
  ...props
}) => {
  // Get theme configuration
  const themeConfig = themeColor ? getThemeConfig(themeColor) : null;

  // Generate unique ID if not provided
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  // Size-specific classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-base',
    lg: 'px-4 py-3 text-lg'
  };

  // Base input classes
  const baseInputClasses = [
    'block',
    'border',
    'rounded-lg',
    'transition-colors',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-1',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    fullWidth && 'w-full',
    icon && iconPosition === 'left' && 'pl-10',
    icon && iconPosition === 'right' && 'pr-10'
  ].filter(Boolean).join(' ');

  // Get input styling based on state and theme
  const getInputClasses = () => {
    if (error) {
      return 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50';
    }

    if (themeConfig) {
      return `border-gray-300 focus:ring-${themeConfig.primary}-500 focus:border-${themeConfig.primary}-500 bg-white`;
    }

    return 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 bg-white';
  };

  // Combine all input classes
  const inputClasses = [
    baseInputClasses,
    sizeClasses[size],
    getInputClasses(),
    className
  ].join(' ');

  // Label classes with theme support
  const getLabelClasses = () => {
    const baseLabel = 'block text-sm font-medium mb-2';
    if (error) {
      return `${baseLabel} text-red-700`;
    }
    if (themeConfig) {
      return `${baseLabel} text-${themeConfig.text}`;
    }
    return `${baseLabel} text-gray-700`;
  };

  // Icon classes
  const getIconClasses = () => {
    const baseIcon = 'absolute inset-y-0 flex items-center pointer-events-none';
    const position = iconPosition === 'left' ? 'left-0 pl-3' : 'right-0 pr-3';
    const color = error ? 'text-red-400' : themeConfig ? `text-${themeConfig.accent}` : 'text-gray-400';
    return `${baseIcon} ${position} ${color}`;
  };

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {/* Label */}
      {label && (
        <label htmlFor={inputId} className={getLabelClasses()}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input container with icon */}
      <div className="relative">
        {/* Icon */}
        {icon && (
          <div className={getIconClasses()}>
            {icon}
          </div>
        )}

        {/* Input field */}
        <input
          id={inputId}
          className={inputClasses}
          {...props}
        />
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {/* Helper text */}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
};

/**
 * Textarea component with similar styling to Input
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  themeColor?: string;
  required?: boolean;
  fullWidth?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  themeColor,
  required = false,
  fullWidth = true,
  resize = 'vertical',
  className = '',
  id,
  ...props
}) => {
  // Get theme configuration
  const themeConfig = themeColor ? getThemeConfig(themeColor) : null;

  // Generate unique ID if not provided
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

  // Base textarea classes
  const baseTextareaClasses = [
    'block',
    'border',
    'rounded-lg',
    'px-3',
    'py-2',
    'transition-colors',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-1',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    fullWidth && 'w-full',
    `resize-${resize}`
  ].filter(Boolean).join(' ');

  // Get textarea styling based on state and theme
  const getTextareaClasses = () => {
    if (error) {
      return 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50';
    }

    if (themeConfig) {
      return `border-gray-300 focus:ring-${themeConfig.primary}-500 focus:border-${themeConfig.primary}-500 bg-white`;
    }

    return 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 bg-white';
  };

  // Combine all textarea classes
  const textareaClasses = [
    baseTextareaClasses,
    getTextareaClasses(),
    className
  ].join(' ');

  // Label classes with theme support
  const getLabelClasses = () => {
    const baseLabel = 'block text-sm font-medium mb-2';
    if (error) {
      return `${baseLabel} text-red-700`;
    }
    if (themeConfig) {
      return `${baseLabel} text-${themeConfig.text}`;
    }
    return `${baseLabel} text-gray-700`;
  };

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {/* Label */}
      {label && (
        <label htmlFor={textareaId} className={getLabelClasses()}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Textarea field */}
      <textarea
        id={textareaId}
        className={textareaClasses}
        {...props}
      />

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {/* Helper text */}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
};