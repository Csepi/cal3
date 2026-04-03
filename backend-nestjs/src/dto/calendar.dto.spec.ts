import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync, type ValidationError } from 'class-validator';
import {
  CalendarVisibility,
  SharePermission,
} from '../entities/calendar.entity';
import {
  CreateCalendarDto,
  ShareCalendarDto,
  UpdateCalendarDto,
} from './calendar.dto';

const validateDto = <T extends object>(
  dtoClass: new () => T,
  payload: Record<string, unknown>,
): ValidationError[] =>
  validateSync(plainToInstance(dtoClass, payload), {
    stopAtFirstError: true,
  });

const hasError = (errors: ValidationError[], property: string): boolean =>
  errors.some((entry) => entry.property === property);

describe('calendar DTO validation', () => {
  describe('CreateCalendarDto', () => {
    it('accepts a valid calendar payload', () => {
      const errors = validateDto(CreateCalendarDto, {
        name: 'Work Calendar',
        description: 'Shared team calendar',
        color: '#0ea5e9',
        icon: 'calendar',
        visibility: CalendarVisibility.SHARED,
        groupId: 3,
        rank: 10,
      });

      expect(errors).toHaveLength(0);
    });

    it('accepts groupId null for explicit group removal/absence intent', () => {
      const errors = validateDto(CreateCalendarDto, {
        name: 'Ungrouped',
        groupId: null,
      });

      expect(errors).toHaveLength(0);
    });

    it('rejects payloads missing required name', () => {
      const errors = validateDto(CreateCalendarDto, {
        description: 'Missing name',
      });

      expect(hasError(errors, 'name')).toBe(true);
    });

    it('rejects invalid enum and numeric fields', () => {
      const errors = validateDto(CreateCalendarDto, {
        name: 'Broken calendar',
        visibility: 'team-only',
        groupId: '3',
        rank: '10',
      });

      expect(hasError(errors, 'visibility')).toBe(true);
      expect(hasError(errors, 'groupId')).toBe(true);
      expect(hasError(errors, 'rank')).toBe(true);
    });
  });

  describe('UpdateCalendarDto', () => {
    it('accepts an empty payload for partial updates', () => {
      const errors = validateDto(UpdateCalendarDto, {});
      expect(errors).toHaveLength(0);
    });

    it('accepts valid partial update fields', () => {
      const errors = validateDto(UpdateCalendarDto, {
        name: 'Updated name',
        visibility: CalendarVisibility.PRIVATE,
        groupId: 7,
        rank: 4,
      });

      expect(errors).toHaveLength(0);
    });

    it('rejects invalid field types', () => {
      const errors = validateDto(UpdateCalendarDto, {
        color: 123,
        icon: {},
        visibility: 'team-only',
        groupId: 'x',
        rank: 'high',
      });

      expect(hasError(errors, 'color')).toBe(true);
      expect(hasError(errors, 'icon')).toBe(true);
      expect(hasError(errors, 'visibility')).toBe(true);
      expect(hasError(errors, 'groupId')).toBe(true);
      expect(hasError(errors, 'rank')).toBe(true);
    });
  });

  describe('ShareCalendarDto', () => {
    it('accepts valid sharing payloads', () => {
      const errors = validateDto(ShareCalendarDto, {
        userIds: [1, 2, 3],
        permission: SharePermission.ADMIN,
      });

      expect(errors).toHaveLength(0);
    });

    it('rejects missing required fields', () => {
      const errors = validateDto(ShareCalendarDto, {});

      expect(hasError(errors, 'userIds')).toBe(true);
      expect(hasError(errors, 'permission')).toBe(true);
    });

    it('rejects invalid users array and permission enum', () => {
      const errors = validateDto(ShareCalendarDto, {
        userIds: [1, '2', null],
        permission: 'owner',
      });

      expect(hasError(errors, 'userIds')).toBe(true);
      expect(hasError(errors, 'permission')).toBe(true);
    });
  });
});
