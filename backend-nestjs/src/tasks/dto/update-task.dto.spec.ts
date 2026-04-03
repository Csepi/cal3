import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync, type ValidationError } from 'class-validator';
import { TaskPriority, TaskStatus } from '../../entities/task.entity';
import { UpdateTaskDto } from './update-task.dto';

jest.mock('../../i18n/runtime', () => ({
  bStatic: (key: string) => key,
}));

const validateDto = (payload: Record<string, unknown>): ValidationError[] =>
  validateSync(plainToInstance(UpdateTaskDto, payload), {
    stopAtFirstError: true,
  });

const hasError = (errors: ValidationError[], property: string): boolean =>
  errors.some((entry) => entry.property === property);

describe('UpdateTaskDto validation', () => {
  it('accepts an empty payload for partial updates', () => {
    const errors = validateDto({});
    expect(errors).toHaveLength(0);
  });

  it('accepts valid partial payloads', () => {
    const errors = validateDto({
      title: 'Updated title',
      bodyFormat: 'markdown',
      color: '#1d4ed8',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.DONE,
      place: 'Remote',
      dueDate: '2026-06-01T09:00:00.000Z',
      dueEnd: '2026-06-01T10:00:00.000Z',
      dueTimezone: 'Europe/Budapest',
      assigneeId: 9,
      labelIds: [2, 3],
    });

    expect(errors).toHaveLength(0);
  });

  it('rejects invalid enum and format values', () => {
    const errors = validateDto({
      bodyFormat: 'html',
      priority: 'critical',
      status: 'queued',
    });

    expect(hasError(errors, 'bodyFormat')).toBe(true);
    expect(hasError(errors, 'priority')).toBe(true);
    expect(hasError(errors, 'status')).toBe(true);
  });

  it('rejects invalid color, date, and scalar field values', () => {
    const errors = validateDto({
      color: '#fff',
      dueDate: 'invalid',
      dueEnd: 'invalid',
      dueTimezone: 'x'.repeat(101),
      place: 'x'.repeat(256),
      assigneeId: 'abc',
    });

    expect(hasError(errors, 'color')).toBe(true);
    expect(hasError(errors, 'dueDate')).toBe(true);
    expect(hasError(errors, 'dueEnd')).toBe(true);
    expect(hasError(errors, 'dueTimezone')).toBe(true);
    expect(hasError(errors, 'place')).toBe(true);
    expect(hasError(errors, 'assigneeId')).toBe(true);
  });

  it('rejects duplicate, oversized, and invalid labelIds', () => {
    const duplicateErrors = validateDto({ labelIds: [1, 1] });
    const oversizedErrors = validateDto({
      labelIds: Array.from({ length: 13 }, (_, index) => index + 1),
    });
    const invalidTypeErrors = validateDto({ labelIds: [1, 'bad'] });

    expect(hasError(duplicateErrors, 'labelIds')).toBe(true);
    expect(hasError(oversizedErrors, 'labelIds')).toBe(true);
    expect(hasError(invalidTypeErrors, 'labelIds')).toBe(true);
  });
});

