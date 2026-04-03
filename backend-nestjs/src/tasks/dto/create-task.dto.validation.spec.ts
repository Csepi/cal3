import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync, type ValidationError } from 'class-validator';
import { TaskPriority, TaskStatus } from '../../entities/task.entity';
import { CreateTaskDto } from './create-task.dto';

jest.mock('../../i18n/runtime', () => ({
  bStatic: (key: string) => key,
}));

const validateDto = (payload: Record<string, unknown>): ValidationError[] =>
  validateSync(plainToInstance(CreateTaskDto, payload), {
    stopAtFirstError: true,
  });

const hasError = (errors: ValidationError[], property: string): boolean =>
  errors.some((entry) => entry.property === property);

const basePayload: Record<string, unknown> = {
  title: 'Ship release notes',
  body: 'Draft and publish release notes',
  bodyFormat: 'markdown',
  color: '#16a34a',
  priority: TaskPriority.HIGH,
  status: TaskStatus.IN_PROGRESS,
  place: 'HQ',
  dueDate: '2026-06-01T09:00:00.000Z',
  dueEnd: '2026-06-01T10:00:00.000Z',
  dueTimezone: 'UTC',
  assigneeId: 4,
  labelIds: [1, 2],
};

describe('CreateTaskDto validation', () => {
  it('accepts a fully valid task payload', () => {
    const errors = validateDto(basePayload);
    expect(errors).toHaveLength(0);
  });

  it('rejects payloads missing required title', () => {
    const { title: _title, ...payloadWithoutTitle } = basePayload;
    const errors = validateDto(payloadWithoutTitle);
    expect(hasError(errors, 'title')).toBe(true);
  });

  it('rejects title and body values exceeding max lengths', () => {
    const errors = validateDto({
      ...basePayload,
      title: 'x'.repeat(241),
      body: 'x'.repeat(8001),
    });

    expect(hasError(errors, 'title')).toBe(true);
    expect(hasError(errors, 'body')).toBe(true);
  });

  it('rejects unsupported format, invalid enum values, and bad color values', () => {
    const errors = validateDto({
      ...basePayload,
      bodyFormat: 'html',
      priority: 'urgent',
      status: 'open',
      color: '#abc',
    });

    expect(hasError(errors, 'bodyFormat')).toBe(true);
    expect(hasError(errors, 'priority')).toBe(true);
    expect(hasError(errors, 'status')).toBe(true);
    expect(hasError(errors, 'color')).toBe(true);
  });

  it('rejects invalid due date fields and invalid assignee id', () => {
    const errors = validateDto({
      ...basePayload,
      dueDate: 'invalid-date',
      dueEnd: 'not-a-date',
      assigneeId: 'abc',
    });

    expect(hasError(errors, 'dueDate')).toBe(true);
    expect(hasError(errors, 'dueEnd')).toBe(true);
    expect(hasError(errors, 'assigneeId')).toBe(true);
  });

  it('rejects label id duplicates, oversized arrays, and non-integer entries', () => {
    const duplicateErrors = validateDto({
      ...basePayload,
      labelIds: [1, 1],
    });
    const oversizedErrors = validateDto({
      ...basePayload,
      labelIds: Array.from({ length: 13 }, (_, index) => index + 1),
    });
    const invalidTypeErrors = validateDto({
      ...basePayload,
      labelIds: [1, 'abc'],
    });

    expect(hasError(duplicateErrors, 'labelIds')).toBe(true);
    expect(hasError(oversizedErrors, 'labelIds')).toBe(true);
    expect(hasError(invalidTypeErrors, 'labelIds')).toBe(true);
  });
});

