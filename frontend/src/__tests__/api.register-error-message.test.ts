import { apiService } from '../services/api';
import { secureFetch } from '../services/authErrorHandler';

jest.mock('../services/authErrorHandler', () => ({
  secureFetch: jest.fn(),
}));

jest.mock('../services/sessionManager', () => ({
  sessionManager: {
    setSessionFromResponse: jest.fn(),
    updateUser: jest.fn(),
    peekRefreshToken: jest.fn(() => null),
    clearSession: jest.fn(),
    hasActiveSession: jest.fn(() => false),
  },
}));

describe('apiService.register error messaging', () => {
  const mockedSecureFetch = secureFetch as jest.MockedFunction<
    typeof secureFetch
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns field-level validation detail when backend includes it', async () => {
    mockedSecureFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'The request is invalid. Please review your input.',
          details: {
            fields: [
              {
                field: 'password',
                reasons: [
                  'Password must include uppercase, lowercase, number, special character, and be 10-128 characters long.',
                ],
              },
            ],
          },
        },
      }),
    } as unknown as Response);

    await expect(
      apiService.register({
        username: 'demo_user',
        email: 'demo@example.com',
        password: 'Password1',
      }),
    ).rejects.toThrow(
      'password: Password must include uppercase, lowercase, number, special character, and be 10-128 characters long.',
    );
  });

  test('falls back to nested backend message when no validation details exist', async () => {
    mockedSecureFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: {
          message: 'The request is invalid. Please review your input.',
        },
      }),
    } as unknown as Response);

    await expect(
      apiService.register({
        username: 'demo_user',
        email: 'demo@example.com',
        password: 'Password1!',
      }),
    ).rejects.toThrow('The request is invalid. Please review your input.');
  });
});
