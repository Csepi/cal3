import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync, type ValidationError } from 'class-validator';
import { UnshareCalendarUsersDto } from './calendar-sharing.dto';

const validateDto = (
  payload: Record<string, unknown>,
): { dto: UnshareCalendarUsersDto; errors: ValidationError[] } => {
  const dto = plainToInstance(UnshareCalendarUsersDto, payload);
  const errors = validateSync(dto, {
    stopAtFirstError: true,
  });
  return { dto, errors };
};

const hasError = (errors: ValidationError[], property: string): boolean =>
  errors.some((entry) => entry.property === property);

describe('UnshareCalendarUsersDto', () => {
  it('accepts valid payloads and transforms string ids to numbers', () => {
    const { dto, errors } = validateDto({
      userIds: ['1', '2', '3'],
    });

    expect(errors).toHaveLength(0);
    expect(dto.userIds).toEqual([1, 2, 3]);
  });

  it('rejects duplicate user ids', () => {
    const { errors } = validateDto({
      userIds: [1, 2, 2],
    });

    expect(hasError(errors, 'userIds')).toBe(true);
  });

  it.each([0, -1, 1.5, 'abc'])(
    'rejects invalid user id value: %s',
    (value) => {
      const { errors } = validateDto({
        userIds: [value],
      });

      expect(hasError(errors, 'userIds')).toBe(true);
    },
  );

  it('rejects arrays larger than 100 entries', () => {
    const oversized = Array.from({ length: 101 }, (_, index) => index + 1);
    const { errors } = validateDto({
      userIds: oversized,
    });

    expect(hasError(errors, 'userIds')).toBe(true);
  });

  it('rejects non-array input', () => {
    const { errors } = validateDto({
      userIds: '1,2',
    });

    expect(hasError(errors, 'userIds')).toBe(true);
  });
});

