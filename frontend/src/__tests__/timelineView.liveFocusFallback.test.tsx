import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import TimelineView from '../components/views/TimelineView';
import type { Event } from '../types/Event';
import { getDailyIdlePromptSelection } from '../utils/liveFocusIdlePrompts';
import {
  DEFAULT_IDLE_PROMPT_FALLBACK,
} from '../utils/liveFocusIdlePromptSelector';

jest.mock('../i18n', () => ({
  i18n: {
    t: (key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? key,
  },
  tStatic: (key: string) => key,
}));

jest.mock('../services/sessionManager', () => ({
  sessionManager: {
    getCurrentUser: jest.fn(() => ({ id: 7 })),
  },
}));

jest.mock('../utils/liveFocusIdlePrompts', () => ({
  getDailyIdlePromptSelection: jest.fn(),
}));

describe('TimelineView idle prompt fallback rendering', () => {
  const mockedGetDailyIdlePromptSelection =
    getDailyIdlePromptSelection as jest.MockedFunction<
      typeof getDailyIdlePromptSelection
    >;

  const renderTimeline = (events: Event[] = []) =>
    render(
      <TimelineView
        currentDate={new Date('2026-03-22T09:00:00.000Z')}
        events={events}
        onEventClick={jest.fn()}
        accentColor="#0ea5e9"
      />,
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('does not show idle meeting fallback when idle prompt selection succeeds', () => {
    mockedGetDailyIdlePromptSelection.mockReturnValue({
      index: 5,
      key: 'idle_prompt_0005',
      text: 'Quiet calendar. Perfect focus block.',
      hasError: false,
    });

    renderTimeline();

    expect(
      screen.getByText('Quiet calendar. Perfect focus block.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('common:liveFocus.noActiveMeeting'),
    ).not.toBeInTheDocument();
  });

  test('shows idle meeting fallback when idle prompt selection errors', () => {
    mockedGetDailyIdlePromptSelection.mockReturnValue({
      index: null,
      key: null,
      text: DEFAULT_IDLE_PROMPT_FALLBACK,
      hasError: true,
    });

    renderTimeline();

    expect(screen.getByText('common:liveFocus.noActiveMeeting')).toBeInTheDocument();
    expect(
      screen.getAllByText('common:liveFocus.noEventRightNow').length,
    ).toBeGreaterThan(0);
  });
});
