import type {
  BookingDomain,
  CalendarDomain,
  EventDomain,
  OrganizationDomain,
  ResourceDomain,
  ResourceTypeDomain,
  TaskDomain,
  UserDomain,
} from './domain.types';

/**
 * Generic DTO helpers.
 */
export type CreateRequest<T extends object> = Omit<
  T,
  'id' | 'createdAt' | 'updatedAt'
>;
export type UpdateRequest<T extends object> = Partial<CreateRequest<T>>;

export type CreateUserRequest = CreateRequest<UserDomain> & {
  password: string;
};
export type UpdateUserRequest = UpdateRequest<UserDomain>;

export type CreateOrganizationRequest = CreateRequest<OrganizationDomain>;
export type UpdateOrganizationRequest = UpdateRequest<OrganizationDomain>;

export type CreateResourceTypeRequest = CreateRequest<ResourceTypeDomain>;
export type UpdateResourceTypeRequest = UpdateRequest<ResourceTypeDomain>;

export type CreateResourceRequest = CreateRequest<ResourceDomain>;
export type UpdateResourceRequest = UpdateRequest<ResourceDomain>;

export type CreateCalendarRequest = CreateRequest<CalendarDomain>;
export type UpdateCalendarRequest = UpdateRequest<CalendarDomain>;

export type CreateEventRequest = CreateRequest<EventDomain>;
export type UpdateEventRequest = UpdateRequest<EventDomain>;

export type CreateBookingRequest = CreateRequest<BookingDomain>;
export type UpdateBookingRequest = UpdateRequest<BookingDomain>;

export type CreateTaskRequest = CreateRequest<TaskDomain>;
export type UpdateTaskRequest = UpdateRequest<TaskDomain>;

/**
 * Generic validation helper shape for DTO/input validation responses.
 */
export interface ValidationIssue {
  readonly field: string;
  readonly reason: string;
  readonly value?: unknown;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly issues: ValidationIssue[];
}
