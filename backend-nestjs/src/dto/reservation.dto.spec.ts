import { plainToInstance } from 'class-transformer';
import { validateSync, type ValidationError } from 'class-validator';
import {
  CreateRecurringReservationDto,
  CreateReservationDto,
  UpdateReservationDto,
} from './reservation.dto';

const baseReservation = {
  startTime: '2026-03-10T10:00:00.000Z',
  endTime: '2026-03-10T11:00:00.000Z',
  quantity: 1,
  customerInfo: { name: 'Jane Doe' },
  notes: 'Safe note',
  resourceId: 5,
};

const validateDto = <T extends object>(
  dtoClass: new () => T,
  payload: Record<string, unknown>,
): ValidationError[] =>
  validateSync(plainToInstance(dtoClass, payload), {
    stopAtFirstError: true,
  });

const hasError = (errors: ValidationError[], property: string): boolean =>
  errors.some((entry) => entry.property === property);

describe('reservation DTO validation', () => {
  describe('CreateReservationDto', () => {
    it('accepts a valid reservation payload', () => {
      const errors = validateDto(CreateReservationDto, baseReservation);
      expect(errors).toHaveLength(0);
    });

    it.each([
      '2026-03-10T09:59:59.000Z',
      '2026-03-10T10:00:00.000Z',
      '2026-03-09T10:00:00.000Z',
      'invalid-date',
      '',
      null,
      undefined,
    ])('rejects invalid endTime sample: %s', (endTime) => {
      const errors = validateDto(CreateReservationDto, {
        ...baseReservation,
        endTime: endTime as unknown,
      });
      expect(hasError(errors, 'endTime')).toBe(true);
    });

    it.each([0, -1, -50, 0.5, '2', 'invalid'])(
      'rejects invalid quantity sample: %s',
      (quantity) => {
        const errors = validateDto(CreateReservationDto, {
          ...baseReservation,
          quantity: quantity as unknown,
        });
        expect(hasError(errors, 'quantity')).toBe(true);
      },
    );

    it.each([
      '<script>alert(1)</script>',
      'javascript:alert(1)',
      'data:text/html;base64,abc',
      123,
      {},
      ['x'],
      true,
    ])('rejects unsafe notes sample: %s', (notes) => {
      const errors = validateDto(CreateReservationDto, {
        ...baseReservation,
        notes: notes as unknown,
      });
      expect(hasError(errors, 'notes')).toBe(true);
    });

    it.each([0, -1, '5', null, undefined])(
      'rejects invalid resourceId sample: %s',
      (resourceId) => {
        const errors = validateDto(CreateReservationDto, {
          ...baseReservation,
          resourceId: resourceId as unknown,
        });
        expect(hasError(errors, 'resourceId')).toBe(true);
      },
    );
  });

  describe('UpdateReservationDto', () => {
    it('allows partial empty payload', () => {
      const errors = validateDto(UpdateReservationDto, {});
      expect(errors).toHaveLength(0);
    });

    it.each([
      '2026-03-10T12:00:00.000Z',
      '2026-03-10T10:00:01.000Z',
      '2026-04-01T00:00:00.000Z',
    ])('accepts valid endTime when startTime is present: %s', (endTime) => {
      const errors = validateDto(UpdateReservationDto, {
        startTime: '2026-03-10T10:00:00.000Z',
        endTime,
      });
      expect(hasError(errors, 'endTime')).toBe(false);
    });

    it.each([
      '2026-03-10T10:00:00.000Z',
      '2026-03-10T09:59:59.000Z',
      'invalid',
    ])('rejects invalid update endTime sample: %s', (endTime) => {
      const errors = validateDto(UpdateReservationDto, {
        startTime: '2026-03-10T10:00:00.000Z',
        endTime: endTime as unknown,
      });
      expect(hasError(errors, 'endTime')).toBe(true);
    });
  });

  describe('CreateRecurringReservationDto', () => {
    const baseRecurring = {
      ...baseReservation,
      recurrencePattern: {
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [1, 3, 5],
      },
    };

    it('accepts a valid recurring payload', () => {
      const errors = validateDto(CreateRecurringReservationDto, baseRecurring);
      expect(errors).toHaveLength(0);
    });

    it.each([null, undefined, 'weekly', 5, []])(
      'rejects invalid recurrencePattern sample: %s',
      (recurrencePattern) => {
        const errors = validateDto(CreateRecurringReservationDto, {
          ...baseReservation,
          recurrencePattern: recurrencePattern as unknown,
        });
        expect(hasError(errors, 'recurrencePattern')).toBe(true);
      },
    );
  });
});
