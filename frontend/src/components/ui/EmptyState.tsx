import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * Empty state helper with optional action.
 *
 * @example
 * ```tsx
 * <EmptyState title="No events" description="Create one to get started" />
 * ```
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => (
  <div className={`rounded-2xl border border-dashed border-gray-200 bg-white/60 p-8 text-center ${className}`}>
    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    {description && <p className="mt-2 text-sm text-gray-600">{description}</p>}
    {actionLabel && onAction && (
      <div className="mt-4 flex justify-center">
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      </div>
    )}
  </div>
);
