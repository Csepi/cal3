/**
 * FloatingActionButton (FAB) - Organism Component
 *
 * Primary action button that floats above content
 * Desktop: Integrated in header
 * Mobile: Floating button (bottom right)
 *
 * Preserves functionality, changes presentation
 */

import React, { useState } from 'react';
import { useScreenSize } from '../../../hooks/useScreenSize';
import { TouchableArea } from '../atoms/TouchableArea';
import { Icon } from '../atoms/Icon';

interface FABAction {
  icon: string | React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  primaryAction: FABAction;
  secondaryActions?: FABAction[];
  themeColor: string;
  className?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  primaryAction,
  secondaryActions = [],
  themeColor,
  className = '',
}) => {
  const { isMobile } = useScreenSize();
  const [isExpanded, setIsExpanded] = useState(false);

  // On desktop, don't render (actions in header)
  if (!isMobile) {
    return null;
  }

  const handlePrimaryClick = () => {
    if (secondaryActions.length > 0) {
      setIsExpanded(!isExpanded);
    } else {
      primaryAction.onClick();
    }
  };

  return (
    <>
      {/* Backdrop when expanded */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* FAB Container */}
      <div className={`fixed bottom-20 right-4 z-50 flex flex-col items-end space-y-3 ${className}`}>
        {/* Secondary Actions (when expanded) */}
        {isExpanded && secondaryActions.map((action, index) => (
          <div
            key={index}
            className="flex items-center space-x-3 animate-in slide-in-from-bottom-2 duration-200"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Label */}
            <span className="bg-gray-800 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
              {action.label}
            </span>

            {/* Mini FAB */}
            <TouchableArea
              onClick={() => {
                action.onClick();
                setIsExpanded(false);
              }}
              className="bg-white shadow-lg rounded-full"
              minSize="lg"
            >
              <div
                className="w-12 h-12 flex items-center justify-center rounded-full"
                style={{ backgroundColor: action.color || themeColor }}
              >
                <Icon icon={action.icon} size="md" className="text-white" />
              </div>
            </TouchableArea>
          </div>
        ))}

        {/* Primary FAB */}
        <TouchableArea
          onClick={handlePrimaryClick}
          onLongPress={secondaryActions.length > 0 ? () => setIsExpanded(true) : undefined}
          className="shadow-2xl"
          minSize="lg"
          ariaLabel={primaryAction.label}
        >
          <div
            className={`
              w-14 h-14 flex items-center justify-center rounded-full
              transition-all duration-300
              ${isExpanded ? 'rotate-45' : 'rotate-0'}
            `}
            style={{ backgroundColor: themeColor }}
          >
            <Icon
              icon={isExpanded ? '✕' : primaryAction.icon}
              size="lg"
              className="text-white"
            />
          </div>
        </TouchableArea>
      </div>
    </>
  );
};
