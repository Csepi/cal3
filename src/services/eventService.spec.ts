import { EventService } from './eventService';

// Mock the database module (the default export is the pg Pool instance)
jest.mock('../database', () => ({
  __esModule: true,
  default: { connect: jest.fn() }
}));

describe('EventService', () => {
  test('getAllEvents returns formatted events', async () => {
    // Arrange: create a fake client that returns rows
    const fakeRows = [
      { id: 1, title: 'Test Event', date: new Date('2025-09-27') }
    ];

    const client = {
      query: jest.fn().mockResolvedValue({ rows: fakeRows }),
      release: jest.fn()
    };

    // Obtain the mocked pool and configure connect
  const mockedPool = require('../database').default as any;
    mockedPool.connect = jest.fn().mockResolvedValue(client);

    // Act
    const result = await EventService.getAllEvents();

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ id: 1, title: 'Test Event', date: '2025-09-27' });
    expect(client.query).toHaveBeenCalled();
  });
});
