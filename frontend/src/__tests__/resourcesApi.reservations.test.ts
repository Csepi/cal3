import { resourcesApi } from '../services/resourcesApi';
import { apiService } from '../services/api';
import { http } from '../lib/http';

jest.mock('../services/api', () => ({
  apiService: {
    getOrganisations: jest.fn(),
  },
}));

jest.mock('../lib/http', () => ({
  http: {
    get: jest.fn(),
  },
}));

describe('resourcesApi wrappers', () => {
  const mockedApiService = apiService as jest.Mocked<typeof apiService>;
  const mockedHttp = http as jest.Mocked<typeof http>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches reservations with encoded resourceId filter', async () => {
    mockedHttp.get.mockResolvedValueOnce([{ id: 1 }] as never);

    const result = await resourcesApi.getReservations('room A/1');

    expect(result).toEqual([{ id: 1 }]);
    expect(mockedHttp.get).toHaveBeenCalledWith(
      '/api/reservations?resourceId=room%20A%2F1',
    );
  });

  it('fetches reservations without a filter when resourceId is omitted', async () => {
    mockedHttp.get.mockResolvedValueOnce([{ id: 2 }] as never);

    const result = await resourcesApi.getReservations();

    expect(result).toEqual([{ id: 2 }]);
    expect(mockedHttp.get).toHaveBeenCalledWith('/api/reservations');
  });

  it('uses http for organisations and keeps compatibility alias via apiService', async () => {
    mockedHttp.get.mockResolvedValueOnce([{ id: 9, name: 'Acme' }] as never);
    mockedApiService.getOrganisations.mockResolvedValueOnce([
      { id: 10, name: 'Legacy' },
    ] as never);

    await expect(resourcesApi.getOrganisations()).resolves.toEqual([
      { id: 9, name: 'Acme' },
    ]);
    await expect(resourcesApi.getAccessibleOrganisations()).resolves.toEqual([
      { id: 10, name: 'Legacy' },
    ]);

    expect(mockedHttp.get).toHaveBeenCalledWith('/api/organisations');
    expect(mockedApiService.getOrganisations).toHaveBeenCalledTimes(1);
  });
});
