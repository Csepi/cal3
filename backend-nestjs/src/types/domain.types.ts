import { UserRole, UsagePlan } from '../entities/user.entity';
import {
  CalendarVisibility,
  SharePermission,
} from '../entities/calendar.entity';
import { EventStatus, RecurrenceType } from '../entities/event.entity';
import { ReservationStatus } from '../entities/reservation.entity';
import { TaskPriority, TaskStatus } from '../entities/task.entity';

/**
 * Canonical domain model types shared by backend services.
 * Keep these aligned with entity fields and API contracts.
 */
export type JsonObject = Record<string, unknown>;

export { UserRole, UsagePlan };
export { CalendarVisibility, SharePermission };
export { EventStatus, RecurrenceType };
export { ReservationStatus };
export { TaskPriority, TaskStatus };

export interface UserDomain {
  readonly id: number;
  readonly username: string;
  readonly email: string;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly role: UserRole;
  readonly usagePlans: UsagePlan[];
  readonly isActive: boolean;
  readonly themeColor: string;
  readonly timezone: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface OrganizationDomain {
  readonly id: number;
  readonly name: string;
  readonly description: string | null;
  readonly color: string;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ResourceTypeDomain {
  readonly id: number;
  readonly name: string;
  readonly description: string | null;
  readonly organisationId: number;
  readonly minBookingDuration: number | null;
  readonly bufferTime: number | null;
  readonly isActive: boolean;
  readonly color: string;
}

export interface ResourceDomain {
  readonly id: number;
  readonly name: string;
  readonly description: string | null;
  readonly capacity: number;
  readonly resourceTypeId: number;
  readonly organisationId: number | null;
  readonly publicBookingToken: string | null;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CalendarDomain {
  readonly id: number;
  readonly name: string;
  readonly description: string | null;
  readonly color: string;
  readonly icon: string | null;
  readonly visibility: CalendarVisibility;
  readonly isActive: boolean;
  readonly isReservationCalendar: boolean;
  readonly isTasksCalendar: boolean;
  readonly ownerId: number;
  readonly groupId: number | null;
  readonly rank: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface EventDomain {
  readonly id: number;
  readonly title: string;
  readonly description: string | null;
  readonly startDate: Date;
  readonly startTime: string | null;
  readonly endDate: Date | null;
  readonly endTime: string | null;
  readonly isAllDay: boolean;
  readonly location: string | null;
  readonly status: EventStatus;
  readonly recurrenceType: RecurrenceType;
  readonly recurrenceRule: JsonObject | string | null;
  readonly parentEventId: number | null;
  readonly recurrenceId: string | null;
  readonly originalDate: Date | null;
  readonly isRecurrenceException: boolean;
  readonly color: string | null;
  readonly icon: string | null;
  readonly notes: string | null;
  readonly tags: string[] | null;
  readonly automationTasks: Array<{
    title: string;
    description?: string;
    dueMinutesBefore?: number;
    createdAt: string;
    createdByRuleId?: number;
  }> | null;
  readonly calendarId: number;
  readonly createdById: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Booking is the canonical business-level name.
 * Reservation is the persisted entity name.
 */
export interface BookingDomain {
  readonly id: number;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly quantity: number;
  readonly customerInfo: JsonObject | null;
  readonly status: ReservationStatus;
  readonly notes: string | null;
  readonly parentReservationId: number | null;
  readonly recurrencePattern: JsonObject | null;
  readonly resourceId: number;
  readonly organisationId: number | null;
  readonly createdById: number | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface TaskLabelDomain {
  readonly id: number;
  readonly name: string;
  readonly color: string;
  readonly userId: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface TaskDomain {
  readonly id: number;
  readonly title: string;
  readonly body: string | null;
  readonly bodyFormat: string;
  readonly color: string;
  readonly priority: TaskPriority;
  readonly status: TaskStatus;
  readonly place: string | null;
  readonly dueDate: Date | null;
  readonly dueEnd: Date | null;
  readonly dueTimezone: string | null;
  readonly ownerId: number;
  readonly assigneeId: number | null;
  readonly calendarEventId: number | null;
  readonly labels: TaskLabelDomain[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
