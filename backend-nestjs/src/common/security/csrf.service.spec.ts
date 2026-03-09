import { CsrfService } from './csrf.service';

describe('CsrfService', () => {
  let service: CsrfService;

  beforeEach(() => {
    service = new CsrfService();
  });

  it('generates URL-safe token strings', () => {
    const token = service.generateToken();
    expect(token.length).toBeGreaterThan(20);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('matches equal tokens', () => {
    const token = service.generateToken();
    expect(service.tokensMatch(token, token)).toBe(true);
  });

  it('rejects different tokens', () => {
    expect(service.tokensMatch('token-a', 'token-b')).toBe(false);
  });

  it('rejects mismatched lengths', () => {
    expect(service.tokensMatch('abcd', 'abcde')).toBe(false);
  });
});
