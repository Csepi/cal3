import { agentService } from '../services/agentService';
import { secureFetch } from '../services/authErrorHandler';

jest.mock('../config/apiConfig', () => ({
  BASE_URL: 'https://api.test',
}));

jest.mock('../services/authErrorHandler', () => ({
  secureFetch: jest.fn(),
}));

describe('agentService', () => {
  const mockedSecureFetch = secureFetch as jest.MockedFunction<
    typeof secureFetch
  >;

  const response = <T,>(
    body: T,
    init: {
      ok?: boolean;
      status?: number;
      jsonRejects?: boolean;
    } = {},
  ): Response =>
    ({
      ok: init.ok ?? true,
      status: init.status ?? 200,
      json: init.jsonRejects
        ? async () => {
            throw new Error('invalid json');
          }
        : async () => body,
    }) as Response;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates an agent with a JSON body and returns the created payload', async () => {
    const created = {
      id: 7,
      name: 'Planner Bot',
      description: 'Assists with scheduling',
      status: 'active' as const,
      createdAt: '2026-04-03T10:00:00.000Z',
      updatedAt: '2026-04-03T10:00:00.000Z',
      actionKeys: [],
      apiKeyCount: 0,
    };

    mockedSecureFetch.mockResolvedValueOnce(response(created));

    await expect(
      agentService.createAgent({
        name: 'Planner Bot',
        description: 'Assists with scheduling',
      }),
    ).resolves.toEqual(created);

    expect(mockedSecureFetch).toHaveBeenCalledWith(
      'https://api.test/api/agents',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: 'Planner Bot',
          description: 'Assists with scheduling',
        }),
      }),
    );

    const requestInit = mockedSecureFetch.mock.calls[0]?.[1] as RequestInit;
    const headers = requestInit.headers as Headers;
    expect(headers.get('Content-Type')).toBe('application/json');
  });

  it('returns undefined for a 204 disable response', async () => {
    mockedSecureFetch.mockResolvedValueOnce(
      ({ ok: true, status: 204, json: jest.fn() } as unknown) as Response,
    );

    await expect(agentService.disableAgent(12)).resolves.toBeUndefined();

    expect(mockedSecureFetch).toHaveBeenCalledWith(
      'https://api.test/api/agents/12',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('falls back to a status-based error message when JSON parsing fails', async () => {
    mockedSecureFetch.mockResolvedValueOnce(
      response('plain text failure', {
        ok: false,
        status: 500,
        jsonRejects: true,
      }),
    );

    await expect(agentService.listAgents()).rejects.toThrow(
      'Request to /agents failed with status 500',
    );
  });
});
