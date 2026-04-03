import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync, type ValidationError } from 'class-validator';
import { CreateTaskLabelDto } from './create-task-label.dto';

jest.mock('../../i18n/runtime', () => ({
  bStatic: (key: string) => key,
}));

const validateDto = (payload: Record<string, unknown>): ValidationError[] =>
  validateSync(plainToInstance(CreateTaskLabelDto, payload), {
    stopAtFirstError: true,
  });

const hasError = (errors: ValidationError[], property: string): boolean =>
  errors.some((entry) => entry.property === property);

describe('CreateTaskLabelDto validation', () => {
  it('accepts valid payloads with and without explicit color', () => {
    const withColorErrors = validateDto({
      name: 'Urgent',
      color: '#dc2626',
    });
    const withoutColorErrors = validateDto({
      name: 'Backlog',
    });

    expect(withColorErrors).toHaveLength(0);
    expect(withoutColorErrors).toHaveLength(0);
  });

  it('rejects missing or invalid names', () => {
    const missingErrors = validateDto({});
    const tooLongErrors = validateDto({ name: 'x'.repeat(65) });
    const invalidTypeErrors = validateDto({ name: 123 });

    expect(hasError(missingErrors, 'name')).toBe(true);
    expect(hasError(tooLongErrors, 'name')).toBe(true);
    expect(hasError(invalidTypeErrors, 'name')).toBe(true);
  });

  it('rejects invalid color values', () => {
    const errors = validateDto({
      name: 'Urgent',
      color: 'red',
    });

    expect(hasError(errors, 'color')).toBe(true);
  });
});

