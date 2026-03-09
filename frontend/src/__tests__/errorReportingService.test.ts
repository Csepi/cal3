import { ErrorReportingService } from '../services/errorReportingService';

describe('ErrorReportingService', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn(async () => ({
      ok: true,
    })) as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });

  it('buffers and submits error reports to backend endpoint', async () => {
    const service = new ErrorReportingService();
    await service.capture('unit-test', 'something failed', { foo: 'bar' });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toContain('/api/monitoring/frontend-errors');
    expect(init.method).toBe('POST');

    const buffered = service.getBufferedErrors();
    expect(buffered.length).toBe(1);
    expect(buffered[0]?.source).toBe('unit-test');
  });
});
