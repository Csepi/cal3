import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync, type ValidationError } from 'class-validator';
import { SharePermission } from '../entities/calendar.entity';
import {
  AssignCalendarsToGroupDto,
  CreateCalendarGroupDto,
  ShareCalendarGroupDto,
  UpdateCalendarGroupDto,
} from './calendar-group.dto';

const validateDto = <T extends object>(
  dtoClass: new () => T,
  payload: Record<string, unknown>,
): ValidationError[] =>
  validateSync(plainToInstance(dtoClass, payload), {
    stopAtFirstError: true,
  });

const hasError = (errors: ValidationError[], property: string): boolean =>
  errors.some((entry) => entry.property === property);

describe('calendar-group DTO validation', () => {
  describe('CreateCalendarGroupDto', () => {
    it('accepts valid payloads', () => {
      const errors = validateDto(CreateCalendarGroupDto, {
        name: 'Family',
        isVisible: true,
      });

      expect(errors).toHaveLength(0);
    });

    it('rejects missing and too-short names', () => {
      const missingNameErrors = validateDto(CreateCalendarGroupDto, {
        isVisible: true,
      });
      const shortNameErrors = validateDto(CreateCalendarGroupDto, {
        name: 'A',
        isVisible: true,
      });

      expect(hasError(missingNameErrors, 'name')).toBe(true);
      expect(hasError(shortNameErrors, 'name')).toBe(true);
    });

    it('rejects non-boolean visibility values', () => {
      const errors = validateDto(CreateCalendarGroupDto, {
        name: 'Team',
        isVisible: 'yes',
      });

      expect(hasError(errors, 'isVisible')).toBe(true);
    });
  });

  describe('UpdateCalendarGroupDto', () => {
    it('accepts empty and valid partial payloads', () => {
      const emptyErrors = validateDto(UpdateCalendarGroupDto, {});
      const payloadErrors = validateDto(UpdateCalendarGroupDto, {
        name: 'Friends',
        isVisible: false,
      });

      expect(emptyErrors).toHaveLength(0);
      expect(payloadErrors).toHaveLength(0);
    });

    it('rejects invalid update payloads', () => {
      const errors = validateDto(UpdateCalendarGroupDto, {
        name: 'X',
        isVisible: 1,
      });

      expect(hasError(errors, 'name')).toBe(true);
      expect(hasError(errors, 'isVisible')).toBe(true);
    });
  });

  describe('AssignCalendarsToGroupDto', () => {
    it('accepts numeric calendar id arrays', () => {
      const errors = validateDto(AssignCalendarsToGroupDto, {
        calendarIds: [1, 2, 3],
      });

      expect(errors).toHaveLength(0);
    });

    it('rejects non-array and non-numeric values', () => {
      const nonArrayErrors = validateDto(AssignCalendarsToGroupDto, {
        calendarIds: '1,2,3',
      });
      const nonNumericErrors = validateDto(AssignCalendarsToGroupDto, {
        calendarIds: [1, '2', null],
      });

      expect(hasError(nonArrayErrors, 'calendarIds')).toBe(true);
      expect(hasError(nonNumericErrors, 'calendarIds')).toBe(true);
    });
  });

  describe('ShareCalendarGroupDto', () => {
    it('accepts valid share payloads', () => {
      const errors = validateDto(ShareCalendarGroupDto, {
        userIds: [4, 5],
        permission: SharePermission.READ,
      });

      expect(errors).toHaveLength(0);
    });

    it('rejects invalid user arrays and permission values', () => {
      const errors = validateDto(ShareCalendarGroupDto, {
        userIds: [4, '5'],
        permission: 'owner',
      });

      expect(hasError(errors, 'userIds')).toBe(true);
      expect(hasError(errors, 'permission')).toBe(true);
    });
  });
});

