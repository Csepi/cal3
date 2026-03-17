import { plainToInstance } from 'class-transformer';
import { validateSync, type ValidationError } from 'class-validator';
import { OAuthCallbackQueryDto } from './oauth-callback.query.dto';

const validateDto = (
  payload: Record<string, unknown>,
): ValidationError[] =>
  validateSync(plainToInstance(OAuthCallbackQueryDto, payload), {
    stopAtFirstError: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  });

const hasError = (errors: ValidationError[], property: string): boolean =>
  errors.some((item) => item.property === property);

describe('OAuthCallbackQueryDto', () => {
  it('accepts Microsoft callback session_state parameter', () => {
    const errors = validateDto({
      code: 'abc123',
      state: 'calendar-sync-17-rjrnct5y3i9',
      session_state: '0020fd6a-fb01-3015-d5fc-145a08c19302',
    });
    expect(errors).toHaveLength(0);
  });

  it('rejects unexpected query parameters', () => {
    const errors = validateDto({
      code: 'abc123',
      state: 'calendar-sync-17-rjrnct5y3i9',
      extra: 'unexpected',
    });
    expect(hasError(errors, 'extra')).toBe(true);
  });
});
