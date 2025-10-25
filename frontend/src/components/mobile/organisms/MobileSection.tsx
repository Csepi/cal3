/**
 * MobileSection - Organism Component
 *
 * Reusable section wrapper for mobile pages
 * Features:
 * - Collapsible sections
 * - Touch-optimized headers
 * - Smooth animations
 * - Icon support
 */

import React, { useState } from 'react';
import { TouchableArea } from '../atoms/TouchableArea';
import { Icon } from '../atoms/Icon';

interface MobileSectionProps {
  title: string;
  icon?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
  className?: string;
  headerAction?: React.ReactNode;
}

export const MobileSection: React.FC<MobileSectionProps> = ({
  title,
  icon,
  children,
  defaultOpen = true,
  collapsible = false,
  className = '',
  headerAction,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      {collapsible ? (
        <TouchableArea
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between p-4 bg-gray-50"
          minSize="lg"
        >
          <div className="flex items-center gap-3">
            {icon && <Icon icon={icon} size="md" />}
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            {headerAction}
            <Icon
              icon={isOpen ? '▼' : '▶'}
              size="sm"
              className="text-gray-500"
            />
          </div>
        </TouchableArea>
      ) : (
        <div className="flex items-center justify-between p-4 bg-gray-50">
          <div className="flex items-center gap-3">
            {icon && <Icon icon={icon} size="md" />}
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          </div>
          {headerAction}
        </div>
      )}

      {/* Content */}
      {(!collapsible || isOpen) && (
        <div className="p-4">
          {children}
        </div>
      )}
    </div>
  );
};
