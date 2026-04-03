import { fireEvent, render, screen } from '@testing-library/react';
import { CalendarHeader } from '../../components/calendar-v2/components/CalendarHeader';
import { CALENDAR_THEMES } from '../../components/calendar-v2/types';
import { TimeFormat, WeekStartDay } from '../../utils/calendar';

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

describe('calendar component integration', () => {
  const settings = {
    weekStartDay: WeekStartDay.MONDAY,
    timeFormat: TimeFormat.TWENTY_FOUR_HOUR,
    showWeekNumbers: false,
    showTimeZone: true,
    timezone: 'UTC',
    defaultView: 'month' as const,
  };

  it('wires header navigation and view switch callbacks in order', () => {
    const onNavigate = jest.fn();
    const onViewChange = jest.fn();
    const currentDate = new Date('2026-04-03T10:00:00.000Z');

    render(
      <CalendarHeader
        currentDate={currentDate}
        view="month"
        interactions={{
          onNavigate,
          onViewChange,
        }}
        theme={CALENDAR_THEMES.default}
        settings={settings}
      />,
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(6);

    fireEvent.click(buttons[0] as HTMLButtonElement);
    fireEvent.click(buttons[1] as HTMLButtonElement);
    fireEvent.click(buttons[2] as HTMLButtonElement);
    fireEvent.click(buttons[3] as HTMLButtonElement);
    fireEvent.click(buttons[4] as HTMLButtonElement);
    fireEvent.click(buttons[5] as HTMLButtonElement);

    expect(onNavigate).toHaveBeenNthCalledWith(1, currentDate, 'previous');
    expect(onNavigate).toHaveBeenNthCalledWith(2, currentDate, 'next');
    expect(onNavigate).toHaveBeenNthCalledWith(3, currentDate, 'today');
    expect(onViewChange).toHaveBeenNthCalledWith(1, 'month');
    expect(onViewChange).toHaveBeenNthCalledWith(2, 'week');
    expect(onViewChange).toHaveBeenNthCalledWith(3, 'day');
  });

});
