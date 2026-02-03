import type { AuthUser } from '../context/AuthContext';
import type { AccessibleOrganization } from '../services/userPermissions';
import type {
  Calendar as CalendarModel,
  CalendarVisibility,
  SharePermission,
} from './Calendar';
import type {
  Event as EventModel,
  RecurrencePattern,
  RecurrenceType,
  RecurrenceEndType,
} from './Event';
import type {
  ReservationRecord as BookingModel,
  ReservationResource as ResourceModel,
  ReservationResourceType as ResourceTypeModel,
  ReservationOrganization as OrganizationModel,
} from './reservation';
import type {
  Task as TaskModel,
  TaskLabel as TaskLabelModel,
  TaskPriority,
  TaskStatus,
} from './Task';

export type {
  CalendarVisibility,
  SharePermission,
  RecurrenceType,
  RecurrenceEndType,
  TaskPriority,
  TaskStatus,
};

export type User = AuthUser;
export type Organization = OrganizationModel | AccessibleOrganization;
export type ResourceType = ResourceTypeModel;
export type Resource = ResourceModel;
export type Calendar = CalendarModel;
export type Event = EventModel & {
  recurrenceRule?: RecurrencePattern | Record<string, unknown>;
};
export type Booking = BookingModel;
export type Task = TaskModel;
export type TaskLabel = TaskLabelModel;
