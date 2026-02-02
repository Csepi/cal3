import { useCallback, useEffect, useMemo, useState } from 'react';
import { tasksApi } from '../services/tasksApi';
import type { TaskLabel, CreateTaskLabelRequest } from '../types/Task';

export function useTaskLabels() {
  const [labels, setLabels] = useState<TaskLabel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadLabels = useCallback(async () => {
    setLoading(true);
    try {
      const response = await tasksApi.getTaskLabels();
      setLabels(response);
      setError(null);
    } catch (err) {
      console.error('Failed to load task labels', err);
      setError(err instanceof Error ? err : new Error('Failed to load task labels'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLabels();
  }, [loadLabels]);

  const createLabel = useCallback(
    async (payload: CreateTaskLabelRequest) => {
      const label = await tasksApi.createTaskLabel(payload);
      setLabels((prev) => [...prev, label]);
      return label;
    },
    [],
  );

  const updateLabel = useCallback(
    async (labelId: number, payload: CreateTaskLabelRequest) => {
      const updated = await tasksApi.updateTaskLabel(labelId, payload);
      setLabels((prev) =>
        prev.map((label) => (label.id === updated.id ? updated : label)),
      );
      return updated;
    },
    [],
  );

  const deleteLabel = useCallback(async (labelId: number) => {
    await tasksApi.deleteTaskLabel(labelId);
    setLabels((prev) => prev.filter((label) => label.id !== labelId));
  }, []);

  return useMemo(
    () => ({
      labels,
      loading,
      error,
      refresh: loadLabels,
      createLabel,
      updateLabel,
      deleteLabel,
    }),
    [createLabel, deleteLabel, labels, loadLabels, loading, error, updateLabel],
  );
}
