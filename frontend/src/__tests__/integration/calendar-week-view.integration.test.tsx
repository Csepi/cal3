import { fireEvent, render, screen } from '@testing-library/react';
import WeekView from '../../components/views/WeekView';
import type { Event } from '../../types/Event';
import type { ReservationRecord } from '../../types/reservation';

jest.mock('../../i18n', () => ({
  tStatic: (key: string, options?: { defaultValue?: string }) =>
    options?.defaultValue ?? key,
}));

jest.mock('../../i18n/useAppTranslation', () => ({
  useAppTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? key,
    i18n: { language: 'en', resolvedLanguage: 'en' },
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string; count?: number }) =>
      options?.defaultValue ?? key,
    i18n: { language: 'en', resolvedLanguage: 'en' },
  }),
}));

describe('WeekView integration', () => {
  it('renders calendar events/reservations and forwards key user interactions', () => {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const eventStart = new Date(currentDate);
    eventStart.setHours(9, 0, 0, 0);

    const reservationStart = new Date(currentDate);
    reservationStart.setHours(13, 0, 0, 0);
    const reservationEnd = new Date(currentDate);
    reservationEnd.setHours(14, 0, 0, 0);

    const events: Event[] = [
      {
        id: 1,
        title: 'Integration Standup',
        startDate: eventStart.toISOString(),
        startTime: '09:00',
        endDate: eventStart.toISOString(),
        endTime: '10:00',
        isAllDay: false,
        color: '#2563eb',
        calendarId: 12,
        createdAt: eventStart.toISOString(),
        updatedAt: eventStart.toISOString(),
      },
    ];

    const reservations: ReservationRecord[] = [
      {
        id: 4,
        startTime: reservationStart.toISOString(),
        endTime: reservationEnd.toISOString(),
        quantity: 1,
        status: 'confirmed',
        resource: {
          id: 8,
          name: 'Boardroom',
        },
      },
    ];

    const onDateClick = jest.fn();
    const onEventClick = jest.fn();

    const { container } = render(
      <WeekView
        currentDate={currentDate}
        events={events}
        reservations={reservations}
        onDateClick={onDateClick}
        onEventClick={onEventClick}
        themeColor="#0ea5e9"
        weekStartDay={1}
        timeFormat="24"
        userTimezone="UTC"
      />,
    );

    expect(screen.getByText('Integration Standup')).toBeVisible();
    fireEvent.click(screen.getByText('Integration Standup'));
    expect(onEventClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, title: 'Integration Standup' }),
    );

    const dayLabel = currentDate.getDate().toString();
    const dayCandidates = screen.getAllByText(dayLabel);
    fireEvent.click(dayCandidates[0]);
    expect(onDateClick).toHaveBeenCalled();

    const hourLabels = container.querySelectorAll('span.text-xs.text-gray-500');
    expect(hourLabels.length).toBeGreaterThan(0);
  });
});
