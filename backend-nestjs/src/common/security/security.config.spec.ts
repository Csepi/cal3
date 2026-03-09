import {
  applyCertificateTransparencyPolicy,
  applyPermissionsPolicy,
  buildHelmetOptions,
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

