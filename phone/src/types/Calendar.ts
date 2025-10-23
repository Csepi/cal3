/**
 * Calendar Type Definitions
 * Matches backend Calendar entity
 */

import type { CalendarColor } from '@constants/theme';

export interface Calendar {
  id: number;
  name: string;
  description?: string;
  color?: CalendarColor;
  isDefault: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCalendarRequest {
  name: string;
  description?: string;
  color?: CalendarColor;
  isDefault?: boolean;
}

export interface UpdateCalendarRequest {
  name?: string;
  description?: string;
  color?: CalendarColor;
  isDefault?: boolean;
}
