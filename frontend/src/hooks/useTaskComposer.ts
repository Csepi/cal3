import { useCallback, useMemo, useState } from 'react';
import { tasksApi } from '../services/tasksApi';
import type { Task, CreateTaskRequest, CreateTaskLabelRequest } from '../types/Task';
import { TaskPriority, TaskStatus } from '../types/Task';

export interface TaskComposerDraft {
  title: string;
  body: string;
  bodyFormat: string;
  color: string;
  priority: TaskPriority;
  status: TaskStatus;
  place: string;
  dueDate: string | null;
  dueEnd: string | null;
  dueTimezone: string | null;
  assigneeId: number | null;
  labelIds: number[];
  inlineLabels: CreateTaskLabelRequest[];
}

const DEFAULT_DRAFT: TaskComposerDraft = {
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

const toDateTimeLocalValue = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const offsetMinutes = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offsetMinutes * 60000);
  return localDate.toISOString().slice(0, 16);
};

const normalizeDateTimeValue = (value?: string | null): string | undefined => {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date.toISOString();
};

const taskToDraft = (task?: Task | null): TaskComposerDraft => {
  if (!task) {
    return { ...DEFAULT_DRAFT };
  }

  return {
    title: task.title ?? '',
    body: task.body ?? '',
    bodyFormat: task.bodyFormat ?? 'markdown',
    color: task.color ?? '#eab308',
    priority: task.priority ?? TaskPriority.MEDIUM,
    status: task.status ?? TaskStatus.TODO,
    place: task.place ?? '',
    dueDate: toDateTimeLocalValue(task.dueDate),
    dueEnd: toDateTimeLocalValue(task.dueEnd),
    dueTimezone: task.dueTimezone ?? null,
    assigneeId: task.assigneeId ?? null,
    labelIds: (task.labels ?? []).map((label) => label.id),
    inlineLabels: [],
  };
};

export function useTaskComposer(initialTask?: Task | null) {
  const [draft, setDraft] = useState<TaskComposerDraft>(() =>
    taskToDraft(initialTask),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const reset = useCallback(
    (task?: Task | null) => {
      setDraft(taskToDraft(task ?? initialTask ?? null));
      setError(null);
    },
    [initialTask],
  );

  const updateField = useCallback(
    <K extends keyof TaskComposerDraft>(field: K, value: TaskComposerDraft[K]) => {
      setDraft((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const toggleLabel = useCallback((labelId: number) => {
    setDraft((prev) => {
      const exists = prev.labelIds.includes(labelId);
      const labelIds = exists
        ? prev.labelIds.filter((id) => id !== labelId)
        : [...prev.labelIds, labelId];
      return { ...prev, labelIds };
    });
  }, []);

  const addInlineLabel = useCallback((label: CreateTaskLabelRequest) => {
    setDraft((prev) => ({
      ...prev,
      inlineLabels: [...prev.inlineLabels, label],
    }));
  }, []);

  const removeInlineLabel = useCallback((index: number) => {
    setDraft((prev) => ({
      ...prev,
      inlineLabels: prev.inlineLabels.filter((_, idx) => idx !== index),
    }));
  }, []);

  const buildPayload = useCallback((): CreateTaskRequest => {
    const payload: CreateTaskRequest = {
      title: draft.title.trim(),
      body: draft.body || undefined,
      bodyFormat: draft.bodyFormat,
      color: draft.color,
      priority: draft.priority,
      status: draft.status,
      place: draft.place || undefined,
      dueDate: normalizeDateTimeValue(draft.dueDate) ?? undefined,
      dueEnd: normalizeDateTimeValue(draft.dueEnd) ?? undefined,
      dueTimezone: draft.dueTimezone ?? undefined,
      assigneeId: draft.assigneeId ?? undefined,
    };

    if (draft.labelIds.length) {
      payload.labelIds = draft.labelIds;
    }
    if (draft.inlineLabels.length) {
      payload.inlineLabels = draft.inlineLabels;
    }

    return payload;
  }, [draft]);

  const save = useCallback(
    async (mode: 'create' | 'update', taskId?: number) => {
      setSaving(true);
      try {
        const payload = buildPayload();
        const targetId = taskId ?? initialTask?.id ?? null;
        if (mode === 'update' && !targetId) {
          throw new Error('Task ID is required to update a task');
        }
        const result =
          mode === 'create'
            ? await tasksApi.createTask(payload)
            : await tasksApi.updateTask(
                targetId as number,
                payload,
              );
        setError(null);
        setDraft(taskToDraft(result));
        return result;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Failed to save task');
        setError(error);
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [buildPayload, initialTask?.id],
  );

  const applyTask = useCallback((task: Task) => {
    setDraft(taskToDraft(task));
  }, []);

  return useMemo(
    () => ({
      draft,
      saving,
      error,
      updateField,
      toggleLabel,
      addInlineLabel,
      removeInlineLabel,
      reset,
      buildPayload,
      save,
      applyTask,
    }),
    [
      addInlineLabel,
      applyTask,
      buildPayload,
      draft,
      error,
      removeInlineLabel,
      reset,
      save,
      saving,
      toggleLabel,
      updateField,
    ],
  );
}
