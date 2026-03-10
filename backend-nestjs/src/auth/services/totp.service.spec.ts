import { TotpService } from './totp.service';

describe('TotpService', () => {
  let service: TotpService;

  beforeEach(() => {
    service = new TotpService();
  });

  it('generates and verifies a code for the same time window', () => {
    const secret = service.createSecret();
    const now = Date.now();
    const code = service.generateCode(secret, now);

    expect(service.verifyCode(secret, code, 0)).toBe(true);
  });

  it('rejects invalid codes', () => {
    const secret = service.createSecret();
    expect(service.verifyCode(secret, '000001', 0)).toBe(false);
    expect(service.verifyCode(secret, 'not-a-code', 0)).toBe(false);
  });

  it('builds otpAuth URI with issuer and account label', () => {
    const secret = service.createSecret();
    const otpAuthUrl = service.generateOtpAuthUrl({
      issuer: 'PrimeCal',
      accountName: 'user@example.com',
      secret,
    });

    expect(otpAuthUrl).toContain('otpauth://totp/');
    expect(otpAuthUrl).toContain('issuer=PrimeCal');
    expect(otpAuthUrl).toContain(`secret=${secret}`);
  });
});
