import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { TaskComposerPanel } from '../components/tasks/TaskComposerPanel';
import type { TaskComposerDraft } from '../hooks/useTaskComposer';
import { TaskPriority, TaskStatus } from '../types/Task';

jest.mock('../i18n', () => ({
  tStatic: (key: string) => key,
}));

const baseDraft: TaskComposerDraft = {
  title: '',
  body: '',
  bodyFormat: 'markdown',
  color: '#eab308',
  priority: TaskPriority.MEDIUM,
  status: TaskStatus.TODO,
  place: '',
  dueDate: null,
  dueEnd: null,
  dueTimezone: null,
  assigneeId: null,
  labelIds: [],
  inlineLabels: [],
};

const labels = [
  {
    id: 11,
    name: 'Ops',
    color: '#2563eb',
    userId: 1,
    createdAt: '2026-04-03T10:00:00.000Z',
    updatedAt: '2026-04-03T10:00:00.000Z',
  },
];

describe('TaskComposerPanel integration flow', () => {
  it('updates draft fields, toggles labels, and saves when title is set', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn().mockResolvedValue(undefined);
    const onToggleLabel = jest.fn();

    const Harness = () => {
      const [draft, setDraft] = useState<TaskComposerDraft>(baseDraft);

      return (
        <TaskComposerPanel
          mode="new"
          draft={draft}
          saving={false}
          error={null}
          onChange={(field, value) =>
            setDraft((previous) => ({ ...previous, [field]: value }))
          }
          onToggleLabel={(labelId) => {
            onToggleLabel(labelId);
            setDraft((previous) => {
              const exists = previous.labelIds.includes(labelId);
              return {
                ...previous,
                labelIds: exists
                  ? previous.labelIds.filter((id) => id !== labelId)
                  : [...previous.labelIds, labelId],
              };
            });
          }}
          onCreateLabel={async (name) => ({
            id: 99,
            name,
            color: '#334155',
            userId: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })}
          onSave={onSave}
          onClose={jest.fn()}
          labels={labels}
          themeColor="#0ea5e9"
        />
      );
    };

    const { container } = render(<Harness />);
    const saveButton = screen.getByRole('button', { name: /Create Task/i });
    expect(saveButton).toBeDisabled();

    const textInputs = container.querySelectorAll<HTMLInputElement>(
      'input[type="text"]',
    );
    expect(textInputs.length).toBeGreaterThanOrEqual(2);

    fireEvent.change(textInputs[0], {
      target: { value: 'Ship release checklist' },
    });
    expect(saveButton).toBeEnabled();

    const selects = container.querySelectorAll<HTMLSelectElement>('select');
    expect(selects).toHaveLength(2);
    fireEvent.change(selects[0], { target: { value: TaskStatus.DONE } });
    fireEvent.change(selects[1], { target: { value: TaskPriority.HIGH } });

    const dueDateInput = container.querySelector<HTMLInputElement>(
      'input[type="datetime-local"]',
    );
    expect(dueDateInput).toBeTruthy();
    fireEvent.change(dueDateInput as HTMLInputElement, {
      target: { value: '2030-04-01T11:00' },
    });
    fireEvent.change(textInputs[1], {
      target: { value: 'Room A' },
    });

    await user.click(screen.getByRole('button', { name: 'Ops' }));
    expect(onToggleLabel).toHaveBeenCalledWith(11);

    await user.click(saveButton);
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
