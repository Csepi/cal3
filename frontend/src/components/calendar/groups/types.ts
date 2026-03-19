import type { Calendar as CalendarType } from '../../../types/Calendar';
import type { CalendarGroupWithCalendars } from '../../../types/CalendarGroup';

export interface CalendarGroupView extends CalendarGroupWithCalendars {
  calendars: CalendarType[];
}
