import { BadRequestException } from '@nestjs/common';
import { ComplianceService } from './compliance.service';

describe('ComplianceService', () => {
  const userRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const consentRepository = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const dsrRepository = {
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const calendarRepository = { count: jest.fn(), find: jest.fn() };
  const eventRepository = { count: jest.fn(), find: jest.fn() };
  const reservationRepository = { count: jest.fn(), find: jest.fn() };
  const taskRepository = { count: jest.fn(), find: jest.fn() };
  const auditTrailService = {
    logSecurityEvent: jest.fn(),
  };

  let service: ComplianceService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ComplianceService(
      userRepository as any,
      consentRepository as any,
      dsrRepository as any,
      calendarRepository as any,
      eventRepository as any,
      reservationRepository as any,
      taskRepository as any,
      auditTrailService as any,
    );
  });

  it('rejects delete request when confirm email mismatches', async () => {
    userRepository.findOne.mockResolvedValue({
      id: 8,
      username: 'bob',
      email: 'bob@example.com',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      service.createDataSubjectRequest(
        8,
        {
          requestType: 'delete',
          confirmEmail: 'wrong@example.com',
        },
        {},
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates pending data subject request', async () => {
    userRepository.findOne.mockResolvedValue({
      id: 8,
      username: 'bob',
      email: 'bob@example.com',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    dsrRepository.count.mockResolvedValue(0);
    dsrRepository.create.mockImplementation((value: Record<string, unknown>) => ({
      id: 22,
      createdAt: new Date('2026-03-10T00:00:00.000Z'),
      updatedAt: new Date('2026-03-10T00:00:00.000Z'),
      ...value,
    }));
    dsrRepository.save.mockImplementation(
      async (value: Record<string, unknown>) => value,
    );

    const result = await service.createDataSubjectRequest(
      8,
      {
        requestType: 'delete',
        confirmEmail: 'bob@example.com',
      },
      {},
    );

    expect(result.status).toBe('pending');
    expect(result.requestType).toBe('delete');
  });
});
