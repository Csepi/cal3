import { act, render, screen, waitFor } from '@testing-library/react';
import { io } from 'socket.io-client';
import { NotificationsProvider, useNotifications } from '../context/NotificationsContext';
import { notificationsApi } from '../services/notificationsApi';
import { sessionManager } from '../services/sessionManager';
import { useAuth } from '../hooks/useAuth';

jest.mock('../config/apiConfig', () => ({
  BASE_URL: 'https://api.test',
}));

jest.mock('../services/notificationsApi', () => ({
  notificationsApi: {
    getNotifications: jest.fn(),
    getThreads: jest.fn(),
    getPreferences: jest.fn(),
    getFilters: jest.fn(),
    getCatalog: jest.fn(),
    getScopeMutes: jest.fn(),
    markAsRead: jest.fn(),
    markAsUnread: jest.fn(),
    markAllRead: jest.fn(),
    toggleThreadMute: jest.fn(),
    toggleThreadArchive: jest.fn(),
    savePreferences: jest.fn(),
    saveFilter: jest.fn(),
    deleteFilter: jest.fn(),
    setScopeMute: jest.fn(),
    removeScopeMute: jest.fn(),
  },
}));

jest.mock('../services/sessionManager', () => ({
  sessionManager: {
    hasActiveSession: jest.fn(),
    getAccessToken: jest.fn(),
  },
}));

jest.mock('../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

const mockSocket = {
  on: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
};

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
}));

describe('NotificationsProvider realtime wiring', () => {
  const mockedNotificationsApi = notificationsApi as jest.Mocked<
    typeof notificationsApi
  >;
  const mockedSessionManager = sessionManager as jest.Mocked<
    typeof sessionManager
  >;
  const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
  const mockedIo = io as jest.MockedFunction<typeof io>;

  const socketHandlers = new Map<string, (...args: any[]) => void>();

  const notifications = [
    {
      id: 1,
      eventType: 'task.created',
      body: 'Task created',
      isRead: false,
      archived: false,
      createdAt: '2026-04-03T10:00:00.000Z',
    },
  ];

  const renderProvider = () => {
    function Consumer() {
      const { loading, unreadCount, notifications: currentNotifications } =
        useNotifications();

      return (
        <div data-testid="state">
          loading={String(loading)}; unread={unreadCount}; notifications=
          {currentNotifications.length}
        </div>
      );
    }

    return render(
      <NotificationsProvider>
        <Consumer />
      </NotificationsProvider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    socketHandlers.clear();

    mockedUseAuth.mockReturnValue({
      isAuthenticated: true,
      currentUser: { onboardingCompleted: true },
    } as never);
    mockedSessionManager.hasActiveSession.mockReturnValue(true);
    mockedSessionManager.getAccessToken.mockResolvedValue('session-token');

    mockedNotificationsApi.getNotifications.mockResolvedValue(notifications as never);
    mockedNotificationsApi.getThreads.mockResolvedValue([] as never);
    mockedNotificationsApi.getPreferences.mockResolvedValue([] as never);
    mockedNotificationsApi.getFilters.mockResolvedValue([] as never);
    mockedNotificationsApi.getCatalog.mockResolvedValue({
      eventTypes: [],
      channels: [],
      scopes: [],
    } as never);
    mockedNotificationsApi.getScopeMutes.mockResolvedValue([] as never);

    mockedIo.mockImplementation(() => mockSocket as never);
    mockSocket.on.mockImplementation((event: string, handler: (...args: any[]) => void) => {
      socketHandlers.set(event, handler);
      return mockSocket as never;
    });
  });

  it('initializes notification state and wires websocket refresh handlers', async () => {
    const { unmount } = renderProvider();

    await waitFor(() => {
      expect(mockedNotificationsApi.getNotifications).toHaveBeenCalledWith({
        unreadOnly: false,
        archived: false,
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('state')).toHaveTextContent('loading=false');
    });

    expect(mockedIo).toHaveBeenCalledWith(
      'wss://api.test/ws/notifications',
      expect.objectContaining({
        transports: ['websocket'],
        path: '/socket.io',
        auth: { token: 'session-token' },
      }),
    );

    await waitFor(() => {
      expect(screen.getByTestId('state')).toHaveTextContent('unread=1');
      expect(screen.getByTestId('state')).toHaveTextContent('notifications=1');
    });

    await act(async () => {
      socketHandlers.get('notification:new')?.();
    });

    await waitFor(() => {
      expect(mockedNotificationsApi.getNotifications).toHaveBeenCalledTimes(2);
    });

    await act(async () => {
      socketHandlers.get('notification:unreadCount')?.({ count: 7 });
    });

    await waitFor(() => {
      expect(screen.getByTestId('state')).toHaveTextContent('unread=7');
    });

    unmount();
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('skips loading and socket setup when onboarding is incomplete', async () => {
    mockedUseAuth.mockReturnValue({
      isAuthenticated: true,
      currentUser: { onboardingCompleted: false },
    } as never);

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('state')).toHaveTextContent('loading=false');
    });

    expect(mockedNotificationsApi.getNotifications).not.toHaveBeenCalled();
    expect(mockedIo).not.toHaveBeenCalled();
  });
});
