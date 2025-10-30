/**
 * TouchableArea - Atomic Component
 *
 * Ensures minimum 44x44px touch target with visual feedback
 * Reusable across all interactive elements
 */

import React from 'react';

interface TouchableAreaProps {
  children: React.ReactNode;
  onClick?: () => void;
  onLongPress?: () => void;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
  minSize?: 'sm' | 'md' | 'lg';
}

export const TouchableArea: React.FC<TouchableAreaProps> = ({
  children,
  onClick,
  onLongPress,
  className = '',
  disabled = false,
  ariaLabel,
  minSize = 'md',
}) => {
  const [isPressed, setIsPressed] = React.useState(false);
  const longPressTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const sizeClasses = {
    sm: 'min-w-[44px] min-h-[44px]',
    md: 'min-w-[48px] min-h-[48px]',
    lg: 'min-w-[56px] min-h-[56px]',
  };

  const handleTouchStart = () => {
    setIsPressed(true);
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        onLongPress();
        // Haptic feedback if available
        if ('vibrate' in navigator) {
          navigator.vibrate(10);
        }
      }, 500);
    }
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
      // Light haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(5);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => {
        setIsPressed(false);
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      }}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`
        ${sizeClasses[minSize]}
        flex items-center justify-center
        transition-all duration-150 ease-out
        active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        ${isPressed ? 'scale-95' : 'scale-100'}
        ${className}
      `}
    >
      {children}
    </button>
  );
};
