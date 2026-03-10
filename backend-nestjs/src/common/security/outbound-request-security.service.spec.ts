import { ForbiddenException } from '@nestjs/common';
import { OutboundRequestSecurityService } from './outbound-request-security.service';
import { lookup } from 'dns/promises';

jest.mock('dns/promises', () => ({
  lookup: jest.fn(),
}));

describe('OutboundRequestSecurityService', () => {
  const lookupMock = lookup as jest.MockedFunction<typeof lookup>;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    lookupMock.mockResolvedValue([{ address: '8.8.8.8', family: 4 }] as never);
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    ) as unknown as typeof fetch;
    delete process.env.OUTBOUND_ALLOWED_HOSTS;
    delete process.env.OUTBOUND_ALLOW_HTTP;
    delete process.env.OUTBOUND_ALLOW_PRIVATE_NETWORKS;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('rejects private destinations resolved from DNS', async () => {
    lookupMock.mockResolvedValue([{ address: '10.1.2.3', family: 4 }] as never);
    const service = new OutboundRequestSecurityService();

    await expect(
      service.send({
        url: 'https://hooks.example.com/callback',
        body: JSON.stringify({ ok: true }),
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('applies signing headers when secret is provided', async () => {
    const service = new OutboundRequestSecurityService();

    await service.send({
      url: 'https://hooks.example.com/callback',
      body: JSON.stringify({ ok: true }),
      signingSecret: 'test-secret',
    });

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0] as [
      URL,
      RequestInit,
    ];
    const headers = fetchCall[1].headers as Headers;
    expect(headers.get('x-primecal-signature')).toContain('sha256=');
    expect(headers.get('x-primecal-timestamp')).toBeTruthy();
  });

  it('rejects URLs with embedded credentials', async () => {
    const service = new OutboundRequestSecurityService();
    await expect(
      service.send({
        url: 'https://user:pass@hooks.example.com/callback',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
