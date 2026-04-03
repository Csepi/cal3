import { plainToInstance } from 'class-transformer';
import { validateSync, type ValidationError } from 'class-validator';
import { TaskPriority, TaskStatus } from '../../entities/task.entity';
import { QueryTasksDto } from './query-tasks.dto';

const validateDto = (payload: Record<string, unknown>): ValidationError[] =>
  validateSync(plainToInstance(QueryTasksDto, payload), {
    stopAtFirstError: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  });

const hasError = (errors: ValidationError[], property: string): boolean =>
  errors.some((entry) => entry.property === property);

describe('QueryTasksDto', () => {
  it('accepts search and sort payloads while transforming numeric fields', () => {
    const dto = plainToInstance(QueryTasksDto, {
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      search: 'alpha beta',
      dueFrom: '2026-03-01T00:00:00.000Z',
      dueTo: '2026-03-31T23:59:59.000Z',
      labelIds: ['1', '2'],
      sortBy: 'dueDate',
      sortDirection: 'asc',
      page: '3',
      limit: '10',
    });

    const errors = validateDto({
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      search: 'alpha beta',
      dueFrom: '2026-03-01T00:00:00.000Z',
      dueTo: '2026-03-31T23:59:59.000Z',
      labelIds: ['1', '2'],
      sortBy: 'dueDate',
      sortDirection: 'asc',
      page: '3',
      limit: '10',
    });

    expect(errors).toHaveLength(0);
    expect(dto.labelIds).toEqual([1, 2]);
    expect(dto.page).toBe(3);
    expect(dto.limit).toBe(10);
  });

  it('applies default pagination values when omitted', () => {
    const dto = plainToInstance(QueryTasksDto, {});

    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(25);
  });

  it('rejects invalid sort values and malformed label ids', () => {
    const errors = validateDto({
      sortBy: 'title',
      sortDirection: 'up',
      labelIds: ['1', 'nope'],
    });

    expect(hasError(errors, 'sortBy')).toBe(true);
    expect(hasError(errors, 'sortDirection')).toBe(true);
    expect(hasError(errors, 'labelIds')).toBe(true);
  });

  it('rejects out-of-range pagination limits', () => {
    const errors = validateDto({
      limit: 101,
      page: 0,
    });

    expect(hasError(errors, 'limit')).toBe(true);
    expect(hasError(errors, 'page')).toBe(true);
  });
});
