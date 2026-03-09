import { IsDateString, validateSync } from 'class-validator';
import {
  IsAfterProperty,
  IsSafeText,
  IsStrongPassword,
} from './security.validators';

class PasswordProbeDto {
  @IsStrongPassword()
  password!: string;
}

class SafeTextProbeDto {
  @IsSafeText()
  text?: string;
}

class DateWindowProbeDto {
  @IsDateString()
  start!: string;

  @IsDateString()
  @IsAfterProperty('start')
  end!: string;
}

const hasError = (errors: ReturnType<typeof validateSync>, field: string) =>
  errors.some((entry) => entry.property === field);

describe('security validators', () => {
  describe('IsStrongPassword', () => {
    it.each([
      'ValidPass#123',
      'Another$ecure1',
      'X9!xxxxxxxxx',
      'Long-Enough1!',
    ])('accepts strong password: %s', (password) => {
      const dto = Object.assign(new PasswordProbeDto(), { password });
      const errors = validateSync(dto);
      expect(hasError(errors, 'password')).toBe(false);
    });

    it.each([
      'short1!',
      'alllowercase1!',
      'ALLUPPERCASE1!',
      'NoSpecialChar1',
      'NoNumberChars!',
      'UPPERONLY!!!!',
      'loweronly!!!!',
    ])('rejects weak password: %s', (password) => {
      const dto = Object.assign(new PasswordProbeDto(), { password });
      const errors = validateSync(dto);
      expect(hasError(errors, 'password')).toBe(true);
    });
  });

  describe('IsSafeText', () => {
    it.each(['hello world', 'meeting-note', 'safe@email.com'])(
      'accepts safe text: %s',
      (text) => {
        const dto = Object.assign(new SafeTextProbeDto(), { text });
        const errors = validateSync(dto);
        expect(hasError(errors, 'text')).toBe(false);
      },
    );

    it.each([
      '<script>alert(1)</script>',
      'javascript:alert(1)',
      'data:text/html;base64,abcd',
    ])('rejects unsafe text: %s', (text) => {
      const dto = Object.assign(new SafeTextProbeDto(), { text });
      const errors = validateSync(dto);
      expect(hasError(errors, 'text')).toBe(true);
    });
  });

  describe('IsAfterProperty', () => {
    it('accepts end date after start date', () => {
      const dto = Object.assign(new DateWindowProbeDto(), {
        start: '2026-01-01T10:00:00.000Z',
        end: '2026-01-01T11:00:00.000Z',
      });
      const errors = validateSync(dto);
      expect(hasError(errors, 'end')).toBe(false);
    });

    it('rejects end date before start date', () => {
      const dto = Object.assign(new DateWindowProbeDto(), {
        start: '2026-01-01T10:00:00.000Z',
        end: '2026-01-01T09:00:00.000Z',
      });
      const errors = validateSync(dto);
      expect(hasError(errors, 'end')).toBe(true);
    });
  });
});
