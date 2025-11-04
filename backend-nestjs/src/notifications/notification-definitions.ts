import { NotificationChannelType } from './notifications.constants';

export interface NotificationEventDefinition {
  type: string;
  label: string;
  description: string;
  category:
    | 'calendar'
    | 'reservation'
    | 'event'
    | 'organisation'
    | 'automation'
    | 'system';
  recommendedChannels: NotificationChannelType[];
  suggestedFallback?: NotificationChannelType[];
}

export const NOTIFICATION_EVENT_DEFINITIONS: NotificationEventDefinition[] = [
  {
    type: 'calendar.shared',
    label: 'Calendar Shared',
    description: 'You were granted access to a calendar.',
    category: 'calendar',
    recommendedChannels: ['email', 'inapp'],
    suggestedFallback: ['webpush'],
  },
  {
    type: 'calendar.unshared',
    label: 'Calendar Access Revoked',
    description: 'Your calendar access has been removed.',
    category: 'calendar',
    recommendedChannels: ['email', 'inapp'],
    suggestedFallback: ['webpush'],
  },
  {
    type: 'event.created',
    label: 'Event Created',
    description: 'A new event was created on one of your calendars.',
    category: 'event',
    recommendedChannels: ['inapp', 'email'],
    suggestedFallback: ['webpush'],
  },
  {
    type: 'event.updated',
    label: 'Event Updated',
    description: 'An existing event was updated.',
    category: 'event',
    recommendedChannels: ['inapp'],
    suggestedFallback: ['webpush'],
  },
  {
    type: 'event.canceled',
    label: 'Event Cancelled',
    description: 'An event was cancelled.',
    category: 'event',
    recommendedChannels: ['inapp', 'email'],
    suggestedFallback: ['webpush'],
  },
  {
    type: 'event.reminder',
    label: 'Event Reminder',
    description: 'Reminder prior to an event start time.',
    category: 'event',
    recommendedChannels: ['mobilepush', 'webpush'],
    suggestedFallback: ['email', 'inapp'],
  },
  {
    type: 'reservation.created',
    label: 'Reservation Created',
    description: 'A reservation was created for one of your resources.',
    category: 'reservation',
    recommendedChannels: ['email', 'inapp'],
    suggestedFallback: ['webpush'],
  },
  {
    type: 'reservation.updated',
    label: 'Reservation Updated',
    description: 'An existing reservation was updated.',
    category: 'reservation',
    recommendedChannels: ['inapp'],
    suggestedFallback: ['email'],
  },
  {
    type: 'reservation.cancelled',
    label: 'Reservation Cancelled',
    description: 'A reservation was cancelled.',
    category: 'reservation',
    recommendedChannels: ['email', 'inapp'],
    suggestedFallback: ['webpush'],
  },
  {
    type: 'reservation.due',
    label: 'Reservation Due Soon',
    description: 'Reminder that a reservation is about to start.',
    category: 'reservation',
    recommendedChannels: ['mobilepush', 'webpush'],
    suggestedFallback: ['email'],
  },
  {
    type: 'organisation.member.assigned',
    label: 'Organisation Membership Added',
    description: 'You were added to an organisation or role.',
    category: 'organisation',
    recommendedChannels: ['email', 'inapp'],
    suggestedFallback: ['webpush'],
  },
  {
    type: 'organisation.member.removed',
    label: 'Organisation Membership Removed',
    description: 'Your organisation membership was removed.',
    category: 'organisation',
    recommendedChannels: ['email', 'inapp'],
    suggestedFallback: ['webpush'],
  },
  {
    type: 'automation.executed',
    label: 'Automation Executed',
    description: 'An automation rule executed successfully.',
    category: 'automation',
    recommendedChannels: ['inapp'],
    suggestedFallback: ['email'],
  },
  {
    type: 'automation.failed',
    label: 'Automation Failed',
    description: 'An automation rule failed to execute.',
    category: 'automation',
    recommendedChannels: ['email', 'inapp'],
    suggestedFallback: ['webpush'],
  },
  {
    type: 'system.broadcast',
    label: 'System Broadcast',
    description: 'Platform-wide announcements or incidents.',
    category: 'system',
    recommendedChannels: ['email', 'inapp'],
    suggestedFallback: ['webpush', 'mobilepush'],
  },
];
