import {
  applyCertificateTransparencyPolicy,
  applyPermissionsPolicy,
  buildHelmetOptions,
  createOriginMatcher,
  resolveAllowedOrigins,
} from './security.config';

describe('security.config', () => {
  it('builds strict CSP defaults', () => {
    const options = buildHelmetOptions(['https://app.example.com']);
    const directives = options.contentSecurityPolicy?.directives;

    expect(directives?.defaultSrc).toContain("'none'");
    expect(directives?.scriptSrc).toContain("'self'");
    expect(directives?.styleSrcAttr).toContain("'none'");
    expect(directives?.upgradeInsecureRequests).toBeDefined();
  });

  it('sets expanded permissions policy header', () => {
    const headers: Record<string, string> = {};
    applyPermissionsPolicy({
      setHeader: (key, value) => {
        headers[key] = value;
      },
    });

    expect(headers['Permissions-Policy']).toContain('camera=()');
    expect(headers['Permissions-Policy']).toContain('accelerometer=()');
  });

  it('sets Expect-CT header for monitoring', () => {
    const originalEnabled = process.env.SECURITY_CT_ENABLED;
    const originalReport = process.env.SECURITY_CT_REPORT_URI;
    const originalMode = process.env.SECURITY_CT_MODE;

    process.env.SECURITY_CT_ENABLED = 'true';
    process.env.SECURITY_CT_REPORT_URI = 'https://ct.example.com/report';
    process.env.SECURITY_CT_MODE = 'enforce';

    const headers: Record<string, string> = {};
    applyCertificateTransparencyPolicy({
      setHeader: (key, value) => {
        headers[key] = value;
      },
    });

    expect(headers['Expect-CT']).toContain('max-age=');
    expect(headers['Expect-CT']).toContain('enforce');
    expect(headers['Expect-CT']).toContain('report-uri=');

    if (originalEnabled === undefined) {
      delete process.env.SECURITY_CT_ENABLED;
    } else {
      process.env.SECURITY_CT_ENABLED = originalEnabled;
    }
    if (originalReport === undefined) {
      delete process.env.SECURITY_CT_REPORT_URI;
    } else {
      process.env.SECURITY_CT_REPORT_URI = originalReport;
    }
    if (originalMode === undefined) {
      delete process.env.SECURITY_CT_MODE;
    } else {
      process.env.SECURITY_CT_MODE = originalMode;
    }
  });
});

const ENV_KEYS = [
  'SECURITY_ALLOWED_ORIGINS',
  'FRONTEND_URL',
  'PUBLIC_APP_URL',
  'BASE_URL',
  'DASHBOARD_URL',
  'WEB_URL',
  'FRONTEND_HOST_PORT',
  'FRONTEND_PORT',
] as const;

describe('security.config origin resolution', () => {
  const originalEnv = new Map<string, string | undefined>();

  beforeAll(() => {
    for (const key of ENV_KEYS) {
      originalEnv.set(key, process.env[key]);
    }
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      const value = originalEnv.get(key);
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it('adds the www counterpart for an apex frontend URL', () => {
    process.env.FRONTEND_URL = 'https://primecal.eu';
    delete process.env.SECURITY_ALLOWED_ORIGINS;

    const origins = resolveAllowedOrigins();

    expect(origins).toEqual(
      expect.arrayContaining(['https://primecal.eu', 'https://www.primecal.eu']),
    );
  });

  it('adds the apex counterpart for a www frontend URL', () => {
    process.env.FRONTEND_URL = 'https://www.primecal.eu';
    delete process.env.SECURITY_ALLOWED_ORIGINS;

    const origins = resolveAllowedOrigins();

    expect(origins).toEqual(
      expect.arrayContaining(['https://www.primecal.eu', 'https://primecal.eu']),
    );
  });

  it('does not invent www aliases for application subdomains', () => {
    process.env.SECURITY_ALLOWED_ORIGINS = 'https://app.primecal.eu';
    delete process.env.FRONTEND_URL;

    const origins = resolveAllowedOrigins();

    expect(origins).toContain('https://app.primecal.eu');
    expect(origins).not.toContain('https://www.app.primecal.eu');
  });

  it('allows the www origin when only the apex site is configured', () => {
    process.env.FRONTEND_URL = 'https://primecal.eu';
    delete process.env.SECURITY_ALLOWED_ORIGINS;

    const matcher = createOriginMatcher(resolveAllowedOrigins());

    expect(matcher('https://www.primecal.eu')).toBe(true);
  });
});
