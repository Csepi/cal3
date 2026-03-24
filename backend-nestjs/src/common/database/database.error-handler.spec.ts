import {
  getDatabaseErrorDetails,
  isRetryableDatabaseError,
} from './database.error-handler';

describe('database error handler', () => {
  it.each([
    [{ code: '23505', message: 'duplicate key value' }, 'unique-violation'],
    [{ code: '23503', message: 'fk violation' }, 'foreign-key-violation'],
    [{ code: '23502', message: 'null value' }, 'not-null-violation'],
    [{ code: '23514', message: 'check violation' }, 'check-violation'],
    [{ code: '22P02', message: 'invalid input syntax' }, 'invalid-input'],
    [{ code: '22007', message: 'invalid datetime format' }, 'invalid-input'],
    [{ code: '22001', message: 'value too long' }, 'invalid-input'],
    [{ code: '42P01', message: 'relation missing' }, 'schema-mismatch'],
    [{ code: '42703', message: 'column missing' }, 'schema-mismatch'],
    [{ code: '42883', message: 'undefined function' }, 'schema-mismatch'],
  ] as const)('maps %# to normalized type %s', (driverError, expectedType) => {
    const details = getDatabaseErrorDetails(driverError);
    expect(details.type).toBe(expectedType);
    expect(details.code).toBe(driverError.code);
  });

  it('maps connection failures by message when code is absent', () => {
    const details = getDatabaseErrorDetails(new Error('connect ECONNREFUSED'));
    expect(details.type).toBe('connection');
  });

  it('maps timeout failures by message when code is absent', () => {
    const details = getDatabaseErrorDetails(new Error('query timed out'));
    expect(details.type).toBe('timeout');
  });

  it('flags only connection and timeout as retryable', () => {
    expect(isRetryableDatabaseError('connection')).toBe(true);
    expect(isRetryableDatabaseError('timeout')).toBe(true);
    expect(isRetryableDatabaseError('schema-mismatch')).toBe(false);
    expect(isRetryableDatabaseError('unique-violation')).toBe(false);
  });

  it('falls back to unknown when no specific mapping exists', () => {
    const details = getDatabaseErrorDetails({
      code: '99999',
      message: 'some provider-specific failure',
    });
    expect(details.type).toBe('unknown');
    expect(details.code).toBe('99999');
  });
});
