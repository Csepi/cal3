import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync, type ValidationError } from 'class-validator';
import { UpdateTaskLabelsDto } from './update-task-labels.dto';

jest.mock('../../i18n/runtime', () => ({
  bStatic: (key: string) => key,
}));

const validateDto = (
  payload: Record<string, unknown>,
): { dto: UpdateTaskLabelsDto; errors: ValidationError[] } => {
  const dto = plainToInstance(UpdateTaskLabelsDto, payload);
  const errors = validateSync(dto, {
    stopAtFirstError: true,
  });
  return { dto, errors };
};

const hasError = (errors: ValidationError[], property: string): boolean =>
  errors.some((entry) => entry.property === property);

describe('UpdateTaskLabelsDto validation', () => {
  it('accepts valid labelIds and inlineLabels payloads', () => {
    const { dto, errors } = validateDto({
      labelIds: ['1', '2'],
      inlineLabels: [{ name: 'Research', color: '#1f2937' }],
    });

    expect(errors).toHaveLength(0);
    expect(dto.labelIds).toEqual([1, 2]);
  });

  it('accepts an empty payload', () => {
    const { errors } = validateDto({});
    expect(errors).toHaveLength(0);
  });

  it('rejects duplicate, oversized, and invalid labelIds payloads', () => {
    const duplicateErrors = validateDto({ labelIds: [1, 1] }).errors;
    const oversizedErrors = validateDto({
      labelIds: Array.from({ length: 21 }, (_, index) => index + 1),
    }).errors;
    const invalidTypeErrors = validateDto({ labelIds: [1, 'bad'] }).errors;

    expect(hasError(duplicateErrors, 'labelIds')).toBe(true);
    expect(hasError(oversizedErrors, 'labelIds')).toBe(true);
    expect(hasError(invalidTypeErrors, 'labelIds')).toBe(true);
  });

  it('rejects invalid nested inline label payloads', () => {
    const { errors } = validateDto({
      inlineLabels: [
        {
          name: 123,
          color: 'red',
        },
      ],
    });

    expect(hasError(errors, 'inlineLabels')).toBe(true);
  });
});

