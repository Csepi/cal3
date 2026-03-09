import { plainToInstance } from 'class-transformer';
import { validateSync, type ValidationError } from 'class-validator';
import { LoginDto, RefreshTokenRequestDto, RegisterDto } from './auth.dto';

const validRegisterPayload = {
  username: 'john_doe',
  email: 'john@example.com',
  password: 'StrongPass#123',
  firstName: 'John',
  lastName: 'Doe',
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

describe('auth DTO validation matrix', () => {
  describe('RegisterDto username', () => {
    it.each([
      'john_doe',
      'john.doe',
      'john-doe',
      'john123',
      'user_name_2026',
      'A123456789',
      'john',
      'JaneDoe001',
      'safe_user',
      'u'.repeat(64),
    ])('accepts valid username: %s', (username) => {
      const errors = validateDto(RegisterDto, {
        ...validRegisterPayload,
        username,
      });
      expect(hasError(errors, 'username')).toBe(false);
    });

    it.each([
      '',
      'a',
      'ab',
      '🔥',
      'x'.repeat(65),
      '<script>alert(1)</script>',
      'javascript:alert(1)',
      'data:text/html;base64,abc',
      123,
      true,
      false,
      {},
      [],
      null,
      undefined,
      '\u0000',
      '\u0007\u0008',
      ' '.repeat(90),
      '\n\t',
    ])('rejects invalid username sample: %s', (username) => {
      const errors = validateDto(RegisterDto, {
        ...validRegisterPayload,
        username: username as unknown,
      });
      expect(hasError(errors, 'username')).toBe(true);
    });
  });

  describe('RegisterDto email', () => {
    it.each([
      'user@example.com',
      'user.name@example.com',
      'user+tag@example.co.uk',
      'first_last@example.io',
      'abc123@example.dev',
      'team@sub.example.com',
      'qa+alerts@example.org',
      'z@example.net',
      'u@x.io',
      'user-name@example.app',
    ])('accepts valid email: %s', (email) => {
      const errors = validateDto(RegisterDto, {
        ...validRegisterPayload,
        email,
      });
      expect(hasError(errors, 'email')).toBe(false);
    });

    it.each([
      '',
      'plainaddress',
      '@example.com',
      'user@',
      'user@@example.com',
      'user example@example.com',
      'user@example',
      'user@.com',
      'user@example..com',
      'user@-example.com',
      'user@example-.com',
      'user@exa mple.com',
      'user@example.com<script>',
      'javascript:alert(1)',
      'data:text/html;base64,abc',
      'a'.repeat(255) + '@example.com',
      100,
      {},
      null,
      undefined,
    ])('rejects invalid email sample: %s', (email) => {
      const errors = validateDto(RegisterDto, {
        ...validRegisterPayload,
        email: email as unknown,
      });
      expect(hasError(errors, 'email')).toBe(true);
    });
  });

  describe('RegisterDto password', () => {
    it.each([
      'StrongPass#123',
      'Valid$Password9',
      'A1!abcdefghij',
      'N3xt-Level@Pass',
      'B0ld&Secure999',
      'Sane_Pass!1234',
      'LongerPass%2026',
      'Qwerty!234A',
      'Good-One#42X',
      'Upperlower7?',
    ])('accepts strong password: %s', (password) => {
      const errors = validateDto(RegisterDto, {
        ...validRegisterPayload,
        password,
      });
      expect(hasError(errors, 'password')).toBe(false);
    });

    it.each([
      'short1!A',
      'alllowercase1!',
      'ALLUPPERCASE1!',
      'NoNumbers!!',
      'NoSpecial1234',
      'lower1234567',
      'UPPER1234567',
      'NoSpeciaL000',
      'onlylettersAA',
      '1234567890!!',
      '        ',
      'Aa1',
      'Aa1!aaaaa',
      'Aa1!bbbb',
      'Aa1!cccc',
      'Aa1!dddd',
      'Aa1!eeee',
      'Aa1!ffff',
      'aa1!aaaaaaaa',
      'AA1!AAAAAAAA',
      'Aa!aaaaaaaaa',
      'Aa1aaaaaaaaa',
      'Aa1!    ',
      `Aa1!${'x'.repeat(125)}`,
      12345,
      {},
      [],
      null,
      undefined,
    ])('rejects weak/invalid password sample: %s', (password) => {
      const errors = validateDto(RegisterDto, {
        ...validRegisterPayload,
        password: password as unknown,
      });
      expect(hasError(errors, 'password')).toBe(true);
    });
  });

  describe('RegisterDto optional names', () => {
    it.each([
      '<script>alert(1)</script>',
      'javascript:alert(1)',
      'data:text/html;base64,abc',
      'x'.repeat(81),
      42,
      {},
      [],
      false,
      true,
    ])('rejects unsafe firstName sample: %s', (firstName) => {
      const errors = validateDto(RegisterDto, {
        ...validRegisterPayload,
        firstName: firstName as unknown,
      });
      expect(hasError(errors, 'firstName')).toBe(true);
    });
  });

  describe('LoginDto', () => {
    it.each([
      'john_doe',
      'john@example.com',
      '   john@example.com   ',
      'simple-user',
      'u'.repeat(254),
    ])('accepts login username sample: %s', (username) => {
      const errors = validateDto(LoginDto, {
        username,
        password: 'anything',
      });
      expect(hasError(errors, 'username')).toBe(false);
    });

    it.each([
      '',
      '<script>alert(1)</script>',
      'javascript:alert(1)',
      'data:text/html;base64,abc',
      'x'.repeat(255),
      123,
      {},
      null,
      undefined,
      false,
    ])('rejects invalid login username sample: %s', (username) => {
      const errors = validateDto(LoginDto, {
        username: username as unknown,
        password: 'anything',
      });
      expect(hasError(errors, 'username')).toBe(true);
    });
  });

  describe('RefreshTokenRequestDto', () => {
    it('allows missing refreshToken when cookie-based flow is used', () => {
      const errors = validateDto(RefreshTokenRequestDto, {});
      expect(errors).toHaveLength(0);
    });

    it('allows valid refreshToken strings', () => {
      const errors = validateDto(RefreshTokenRequestDto, {
        refreshToken: 'refresh-token-value',
      });
      expect(hasError(errors, 'refreshToken')).toBe(false);
    });

    it('rejects refreshToken above max length', () => {
      const errors = validateDto(RefreshTokenRequestDto, {
        refreshToken: 'r'.repeat(4097),
      });
      expect(hasError(errors, 'refreshToken')).toBe(true);
    });

    it('rejects non-string refreshToken values', () => {
      const errors = validateDto(RefreshTokenRequestDto, {
        refreshToken: 1234,
      });
      expect(hasError(errors, 'refreshToken')).toBe(true);
    });
  });

  describe('transform/sanitization behavior', () => {
    it('trims username and normalizes/lowercases email', () => {
      const dto = plainToInstance(RegisterDto, {
        ...validRegisterPayload,
        username: '  John_Doe\u0000  ',
        email: '  John.Doe@Example.COM  ',
      });

      expect(dto.username).toBe('John_Doe');
      expect(dto.email).toBe('john.doe@example.com');
    });
  });
});
