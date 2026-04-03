import { fireEvent, render, screen } from '@testing-library/react';
import { TaskBoard } from '../../components/tasks/TaskBoard';
import type { Task } from '../../types/Task';

jest.mock('../../i18n', () => ({
  tStatic: (key: string, options?: { defaultValue?: string }) =>
    options?.defaultValue ?? key,
}));

jest.mock('../../i18n/useAppTranslation', () => ({
  useAppTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? key,
    i18n: { language: 'en', resolvedLanguage: 'en' },
  }),
}));

describe('TaskBoard integration', () => {
  const todoTask: Task = {
    id: 101,
    title: 'Prepare release checklist',
    body: null,
    bodyFormat: 'plain',
    color: '#0ea5e9',
    priority: 'medium',
    status: 'todo',
    ownerId: 1,
    dueDate: '2031-01-15T09:00:00.000Z',
    dueEnd: null,
    dueTimezone: 'UTC',
    assigneeId: null,
    assignee: null,
    calendarEventId: null,
    taskSyncChecksum: null,
    createdAt: '2031-01-01T09:00:00.000Z',
    updatedAt: '2031-01-01T09:00:00.000Z',
    labels: [{ id: 7, name: 'Release', color: '#2563eb' }],
  };

  const doneTask: Task = {
    ...todoTask,
    id: 202,
    title: 'Publish release notes',
    status: 'done',
  };

  it('renders task cards and forwards selection + drag-drop transitions', () => {
    const onSelect = jest.fn();
    const onMoveTask = jest.fn();

    render(
      <TaskBoard
        tasks={[todoTask, doneTask]}
        onSelect={onSelect}
        onMoveTask={onMoveTask}
        themeColor="#0ea5e9"
        timeFormat="24h"
        timezone="UTC"
      />,
    );

    expect(screen.getByText('Prepare release checklist')).toBeVisible();
    expect(screen.getByText('Publish release notes')).toBeVisible();
    expect(screen.getAllByText('Release').length).toBeGreaterThanOrEqual(1);

    fireEvent.click(screen.getByText('Prepare release checklist'));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 101, title: 'Prepare release checklist' }),
    );

    const doneCard = screen.getByText('Publish release notes');
    const doneColumn = doneCard.closest('section');
    expect(doneColumn).not.toBeNull();

    const dataTransfer = {
      getData: jest.fn(() => String(todoTask.id)),
      setData: jest.fn(),
    };

    fireEvent.drop(doneColumn as HTMLElement, { dataTransfer });

    expect(onMoveTask).toHaveBeenCalledWith(
      expect.objectContaining({ id: 101 }),
      'done',
    );
  });
});
