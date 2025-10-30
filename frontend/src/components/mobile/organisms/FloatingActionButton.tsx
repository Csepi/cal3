/**
 * FloatingActionButton (FAB) - Organism Component
 *
 * Primary action button that floats above content.
 * Desktop: Integrated in header
 * Mobile: Floating button (bottom right)
 *
 * Preserves functionality, changes presentation.
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
  const hasSecondaryActions = secondaryActions.length > 0;

  if (!isMobile) {
    return null;
  }

  const handlePrimaryClick = () => {
    if (hasSecondaryActions) {
      setIsExpanded((current) => !current);
    } else {
      primaryAction.onClick();
    }
  };

  const handleSecondaryClick = (action: FABAction) => {
    action.onClick();
    setIsExpanded(false);
  };

  return (
    <>
      {isExpanded && (
        <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setIsExpanded(false)} />
      )}

      <div className={`fixed bottom-20 right-4 z-50 flex flex-col items-end space-y-3 ${className}`}>
        {isExpanded &&
          secondaryActions.map((action, index) => (
            <div
              key={action.label}
              className="flex items-center space-x-3 animate-in slide-in-from-bottom-2 duration-200"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="rounded-lg bg-gray-800 px-3 py-2 text-sm text-white shadow-lg whitespace-nowrap">
                {action.label}
              </span>

              <TouchableArea
                onClick={() => handleSecondaryClick(action)}
                className="rounded-full bg-white shadow-lg"
                minSize="lg"
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ backgroundColor: action.color || themeColor }}
                >
                  <Icon icon={action.icon} size="md" className="text-white" />
                </div>
              </TouchableArea>
            </div>
          ))}

        <TouchableArea
          onClick={handlePrimaryClick}
          onLongPress={hasSecondaryActions ? () => setIsExpanded(true) : undefined}
          className="shadow-2xl"
          minSize="lg"
          ariaLabel={primaryAction.label}
        >
          <div
            className={`
              flex h-14 w-14 items-center justify-center rounded-full
              transition-all duration-300
              ${isExpanded ? 'rotate-45' : 'rotate-0'}
            `}
            style={{ backgroundColor: themeColor }}
          >
            <Icon icon={isExpanded ? 'x' : primaryAction.icon} size="lg" className="text-white" />
          </div>
        </TouchableArea>
      </div>
    </>
  );
};
