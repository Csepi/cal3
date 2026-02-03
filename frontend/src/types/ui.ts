import type { ReactNode } from 'react';

/**
 * Common component prop contracts for reusable UI primitives.
 */
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
}

export interface ThemedComponentProps extends BaseComponentProps {
  themeColor?: string;
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export interface PaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}
