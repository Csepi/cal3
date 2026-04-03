import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ListReservationsQueryDto } from './list-reservations.query.dto';

describe('ListReservationsQueryDto', () => {
  it('accepts an empty query payload', () => {
    const dto = plainToInstance(ListReservationsQueryDto, {});

    expect(validateSync(dto)).toHaveLength(0);
  });

  it('transforms a string resourceId into a valid number', () => {
    const dto = plainToInstance(ListReservationsQueryDto, {
      resourceId: '7',
    });

    expect(dto.resourceId).toBe(7);
    expect(validateSync(dto)).toHaveLength(0);
  });

  it.each([0, -1, 1.5, 'abc'])(
    'rejects invalid resourceId payload: %s',
    (resourceId) => {
      const dto = plainToInstance(ListReservationsQueryDto, {
        resourceId,
      });

      const errors = validateSync(dto);

      expect(errors.some((entry) => entry.property === 'resourceId')).toBe(
        true,
      );
    },
  );
});
