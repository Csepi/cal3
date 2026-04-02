import { AuthController } from './auth.controller';
import {
  DEVICE_FINGERPRINT_COOKIE,
  DEVICE_FINGERPRINT_HEADER,
} from './services/token-fingerprint.service';
import { CSRF_COOKIE_NAME } from '../common/security/csrf.service';

describe('AuthController', () => {
  const authService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshSession: jest.fn(),
    logout: jest.fn(),
    completeOnboarding: jest.fn(),
    getUserProfile: jest.fn(),
    issueWidgetToken: jest.fn(),
    isUsernameAvailable: jest.fn(),
    isEmailAvailable: jest.fn(),
  };
  const configurationService = {
    getBackendBaseUrl: jest.fn(),
    getFrontendBaseUrl: jest.fn(),
  };
  const tokenFingerprintService = {
    extractFingerprint: jest.fn(),
    createFingerprint: jest.fn(),
    hashFingerprint: jest.fn(),
  };
  const csrfService = {
    generateToken: jest.fn(),
  };
  const mfaService = {
    getStatus: jest.fn(),
    createSetupChallenge: jest.fn(),
    enableMfa: jest.fn(),
    disableMfa: jest.fn(),
  };

  let controller: AuthController;

  const authSession = {
    response: {
      access_token: 'access-token',
      token_type: 'Bearer',
      expires_in: 900,
      refresh_expires_at: '2030-01-01T00:00:00.000Z',
      issued_at: '2030-01-01T00:00:00.000Z',
      user: {
        id: 99,
        username: 'alice',
        email: 'alice@example.com',
        role: 'user',
        themeColor: '#3b82f6',
        onboardingCompleted: false,
      },
    },
    refreshToken: 'refresh-token',
    refreshExpiresAt: new Date('2030-01-01T00:00:00.000Z'),
    user: {
      id: 99,
    },
  };

  const createResponse = () => ({
    cookie: jest.fn(),
    clearCookie: jest.fn(),
    setHeader: jest.fn(),
    redirect: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    tokenFingerprintService.createFingerprint.mockReturnValue('fp-created');
    tokenFingerprintService.hashFingerprint.mockReturnValue('fp-hash');
    csrfService.generateToken.mockReturnValue('csrf-generated');
    authService.register.mockResolvedValue(authSession);
    authService.login.mockResolvedValue(authSession);
    authService.refreshSession.mockResolvedValue(authSession);
    controller = new AuthController(
      authService as never,
      configurationService as never,
      tokenFingerprintService as never,
      csrfService as never,
      mfaService as never,
    );
  });

  it('returns existing csrf token from cookie without setting a new cookie', async () => {
    const req = {
      cookies: {
        [CSRF_COOKIE_NAME]: 'existing-csrf',
      },
      headers: {},
    };
    const res = createResponse();

    const result = await controller.getCsrfToken(req as never, res as never);

    expect(result.csrfToken).toBe('existing-csrf');
    expect(res.cookie).not.toHaveBeenCalled();
  });

  it('issues csrf cookie when token is missing', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    const req = {
      cookies: {},
      headers: {},
    };
    const res = createResponse();

    await controller.getCsrfToken(req as never, res as never);

    expect(res.cookie).toHaveBeenCalledWith(
      CSRF_COOKIE_NAME,
      'csrf-generated',
      expect.objectContaining({
        sameSite: 'strict',
        secure: false,
      }),
    );
    process.env.NODE_ENV = originalEnv;
  });

  it('registers native client with fingerprint header and refresh token in response', async () => {
    const req = {
      ip: '1.2.3.4',
      headers: {
        'user-agent': 'jest-agent',
        'x-primecal-client': 'mobile-native',
      },
      cookies: {},
    };
    const res = createResponse();

    const result = await controller.register(
      {
        username: 'alice',
        email: 'alice@example.com',
        password: 'StrongPass#123',
      },
      req as never,
      res as never,
    );

    expect(authService.register).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'alice' }),
      expect.objectContaining({
        ip: '1.2.3.4',
        fingerprintHash: 'fp-hash',
      }),
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      DEVICE_FINGERPRINT_HEADER,
      'fp-created',
    );
    expect(result.refresh_token).toBe('refresh-token');
    expect(res.cookie).toHaveBeenCalledWith(
      DEVICE_FINGERPRINT_COOKIE,
      'fp-created',
      expect.objectContaining({
        sameSite: 'none',
      }),
    );
    expect(res.cookie).toHaveBeenCalledWith(
      'cal3_refresh_token',
      'refresh-token',
      expect.objectContaining({
        sameSite: 'none',
        path: '/api/auth',
      }),
    );
  });

  it('refreshes session using body refresh token over cookie token', async () => {
    const req = {
      ip: '2.2.2.2',
      headers: {
        'user-agent': 'jest-agent',
      },
      cookies: {
        cal3_refresh_token: 'cookie-token',
      },
    };
    const res = createResponse();

    await controller.refresh(
      { refreshToken: 'body-token' },
      req as never,
      res as never,
    );

    expect(authService.refreshSession).toHaveBeenCalledWith(
      'body-token',
      expect.objectContaining({ ip: '2.2.2.2' }),
    );
  });

  it('logs out using body token and forwards bearer access token metadata', async () => {
    const req = {
      user: { id: 55 },
      ip: '3.3.3.3',
      headers: {
        authorization: 'Bearer access-123',
      },
      cookies: {
        cal3_refresh_token: 'cookie-token',
      },
    };
    const res = createResponse();

    await controller.logout(
      req as never,
      { refreshToken: 'body-token' },
      res as never,
    );

    expect(authService.logout).toHaveBeenCalledWith(
      55,
      'body-token',
      expect.objectContaining({
        accessToken: 'access-123',
      }),
    );
    expect(res.clearCookie).toHaveBeenCalledWith(
      'cal3_refresh_token',
      expect.objectContaining({
        path: '/api/auth',
      }),
    );
  });

  it('redirects Google callback to calendar-sync backend endpoint when state indicates sync', async () => {
    configurationService.getBackendBaseUrl.mockReturnValue('https://backend.example');
    const req = {
      user: authSession,
      query: {
        state: 'calendar-sync:google',
        code: 'google-code',
      },
      headers: {},
      cookies: {},
    };
    const res = createResponse();

    await controller.googleAuthRedirect(req as never, res as never);

    expect(res.redirect).toHaveBeenCalledWith(
      'https://backend.example/api/calendar-sync/callback/google?code=google-code&state=calendar-sync:google&userId=99',
    );
  });

  it('redirects Google callback to frontend auth route for normal sign-in', async () => {
    configurationService.getFrontendBaseUrl.mockReturnValue('https://frontend.example');
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const req = {
      user: authSession,
      query: {},
      headers: {},
      cookies: {},
    };
    const res = createResponse();

    await controller.googleAuthRedirect(req as never, res as never);

    expect(res.cookie).toHaveBeenCalledWith(
      'cal3_refresh_token',
      'refresh-token',
      expect.objectContaining({ path: '/api/auth' }),
    );
    expect(res.redirect).toHaveBeenCalledWith(
      'https://frontend.example/auth/callback?token=access-token&provider=google',
    );
    consoleSpy.mockRestore();
  });

  it('redirects Microsoft callback to calendar-sync backend endpoint when requested', async () => {
    configurationService.getBackendBaseUrl.mockReturnValue('https://backend.example');
    const req = {
      user: authSession,
      query: {
        state: 'calendar-sync:microsoft',
        code: 'ms-code',
      },
      headers: {},
      cookies: {},
    };
    const res = createResponse();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await controller.microsoftAuthRedirect(req as never, res as never);

    expect(res.redirect).toHaveBeenCalledWith(
      'https://backend.example/api/calendar-sync/callback/microsoft?code=ms-code&state=calendar-sync:microsoft&userId=99',
    );
    consoleSpy.mockRestore();
  });
});

