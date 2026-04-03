import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync, type ValidationError } from 'class-validator';
import { UpdateTaskLabelDto } from './update-task-label.dto';

jest.mock('../../i18n/runtime', () => ({
  bStatic: (key: string) => key,
}));

const validateDto = (payload: Record<string, unknown>): ValidationError[] =>
  validateSync(plainToInstance(UpdateTaskLabelDto, payload), {
    stopAtFirstError: true,
  });

const hasError = (errors: ValidationError[], property: string): boolean =>
  errors.some((entry) => entry.property === property);

describe('UpdateTaskLabelDto validation', () => {
  it('accepts empty and valid partial payloads', () => {
    const emptyErrors = validateDto({});
    const partialErrors = validateDto({
      name: 'Renamed label',
      color: '#0ea5e9',
    });

    expect(emptyErrors).toHaveLength(0);
    expect(partialErrors).toHaveLength(0);
  });

  it('rejects invalid name values', () => {
    const tooLongErrors = validateDto({ name: 'x'.repeat(65) });
    const invalidTypeErrors = validateDto({ name: 123 });

    expect(hasError(tooLongErrors, 'name')).toBe(true);
    expect(hasError(invalidTypeErrors, 'name')).toBe(true);
  });

  it('rejects invalid color values', () => {
    const errors = validateDto({
      color: '#fff',
    });

    expect(hasError(errors, 'color')).toBe(true);
  });
});

