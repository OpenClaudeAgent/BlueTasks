import {useCallback, useEffect, useRef, useState} from 'react';
import type {TFunction} from 'i18next';
import {areasApi, tasksApi} from '../../api';
import {coerceAreaIcon} from '../../lib/areaIcons';
import {
  applyRecurringStatusToggle,
  applySavedTaskPreservingLexicalShape,
  createTask,
  getTaskSection,
  isSaveSuperseded,
  mergeTaskFromApi,
  sortTasks,
  toTaskDraftPayload,
} from '../../lib/tasks';
import {
  AREA_FILTER_ALL,
  AREA_FILTER_UNCATEGORIZED,
  type Area,
  type AreaFilter,
  type SectionId,
  type Task,
  type TaskDraftUpdate,
} from '../../types';
import type {PendingTaskSave} from './constants';
import {SAVE_DELAY_MS} from './constants';

/** Stable setters only (avoid new object identity each render). */
export type BlueTasksUiBridge = {
  setLoading: (value: boolean) => void;
  setErrorMessage: (value: string | null) => void;
  setSelectedSection: (value: SectionId) => void;
  setSelectedTaskId: (value: string | null) => void;
  setTitleFocusTaskId: (value: string | null) => void;
};

export function useBlueTasksTasksAndSaves(bridge: BlueTasksUiBridge, t: TFunction) {
  const bridgeRef = useRef(bridge);
  bridgeRef.current = bridge;
  const tRef = useRef(t);
  tRef.current = t;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({});
  const pendingSavesRef = useRef(new Map<string, PendingTaskSave>());
  const saveRevRef = useRef(new Map<string, number>());
  const saveTimersRef = useRef(new Map<string, number>());
  const flushChainsRef = useRef(new Map<string, Promise<void>>());

  const fetchAndApplyLists = useCallback(async () => {
    const [nextTasks, nextAreas] = await Promise.all([tasksApi.list(), areasApi.list()]);
    setTasks(sortTasks(nextTasks.map((task) => mergeTaskFromApi(task as Task))));
    setAreas(nextAreas.map((a) => ({...a, icon: coerceAreaIcon(a.icon)})));
    bridgeRef.current.setErrorMessage(null);
  }, []);

  const loadTasksAndAreas = useCallback(async () => {
    try {
      bridgeRef.current.setLoading(true);
      await fetchAndApplyLists();
    } catch (error) {
      const tr = tRef.current;
      bridgeRef.current.setErrorMessage(error instanceof Error ? error.message : tr('errors.loadTasks'));
    } finally {
      bridgeRef.current.setLoading(false);
    }
  }, [fetchAndApplyLists]);

  useEffect(() => {
    const timerMap = saveTimersRef.current;
    const pendingMap = pendingSavesRef.current;
    const revMap = saveRevRef.current;
    const chainMap = flushChainsRef.current;

    void loadTasksAndAreas();

    return () => {
      timerMap.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timerMap.clear();
      pendingMap.clear();
      revMap.clear();
      chainMap.clear();
    };
  }, [loadTasksAndAreas]);

  const refreshTasksAndAreas = useCallback(async () => {
    try {
      await fetchAndApplyLists();
    } catch (error) {
      const tr = tRef.current;
      bridgeRef.current.setErrorMessage(error instanceof Error ? error.message : tr('errors.loadTasks'));
    }
  }, [fetchAndApplyLists]);

  function setSavingFlag(taskId: string, value: boolean) {
    setSavingIds((current) => {
      if (!value) {
        const next = {...current};
        delete next[taskId];
        return next;
      }

      return {
        ...current,
        [taskId]: true,
      };
    });
  }

  function scheduleSave(task: Task) {
    const existingTimeout = saveTimersRef.current.get(task.id);
    if (existingTimeout) {
      window.clearTimeout(existingTimeout);
    }

    const rev = (saveRevRef.current.get(task.id) ?? 0) + 1;
    saveRevRef.current.set(task.id, rev);
    pendingSavesRef.current.set(task.id, {
      payload: toTaskDraftPayload(task),
      rev,
    });
    setSavingFlag(task.id, true);

    const timeoutId = window.setTimeout(() => {
      void flushSave(task.id);
    }, SAVE_DELAY_MS);

    saveTimersRef.current.set(task.id, timeoutId);
  }

  function flushSave(taskId: string) {
    saveTimersRef.current.delete(taskId);

    const tail = flushChainsRef.current.get(taskId) ?? Promise.resolve();
    const next = tail.catch(() => {}).then(() => runFlushChain(taskId));
    flushChainsRef.current.set(taskId, next);
    void next;
  }

  async function runFlushChain(taskId: string) {
    try {
      while (true) {
        const meta = pendingSavesRef.current.get(taskId);
        if (!meta) {
          break;
        }

        const {payload, rev: sentRev} = meta;

        try {
          const saved = await tasksApi.update(taskId, payload);
          const still = pendingSavesRef.current.get(taskId);

          if (!still) {
            break;
          }

          if (isSaveSuperseded(sentRev, still)) {
            bridgeRef.current.setErrorMessage(null);
            continue;
          }

          pendingSavesRef.current.delete(taskId);
          const normalized = mergeTaskFromApi(saved as Task);
          setTasks((current) => {
            const local = current.find((task) => task.id === taskId);
            if (!local) {
              return current;
            }
            const next = applySavedTaskPreservingLexicalShape(local, normalized);
            return sortTasks(current.map((task) => (task.id === taskId ? next : task)));
          });
          bridgeRef.current.setErrorMessage(null);
        } catch (error) {
          const tr = tRef.current;
          bridgeRef.current.setErrorMessage(error instanceof Error ? error.message : tr('errors.updateTask'));
          pendingSavesRef.current.delete(taskId);
          await loadTasksAndAreas();
          break;
        }
      }
    } finally {
      const hasPending = pendingSavesRef.current.has(taskId);
      const hasTimer = saveTimersRef.current.has(taskId);
      if (!hasPending && !hasTimer) {
        setSavingFlag(taskId, false);
      }
    }
  }

  function handleTaskMutation(taskId: string, mutate: (task: Task) => Task) {
    let nextTask: Task | null = null;

    setTasks((current) => {
      const currentTask = current.find((task) => task.id === taskId);
      if (!currentTask) {
        return current;
      }

      nextTask = {
        ...mutate(currentTask),
        updatedAt: new Date().toISOString(),
      };

      return sortTasks(current.map((task) => (task.id === taskId ? nextTask! : task)));
    });

    if (nextTask) {
      scheduleSave(nextTask);
    }
  }

  function handleTaskDraftChange(taskId: string, update: TaskDraftUpdate) {
    handleTaskMutation(taskId, (current) => ({
      ...current,
      ...update,
    }));
  }

  async function handleAddTask(areaFilter: AreaFilter) {
    const captureAreaId =
      areaFilter !== AREA_FILTER_ALL && areaFilter !== AREA_FILTER_UNCATEGORIZED ? areaFilter : null;
    const optimisticTask = createTask('', captureAreaId);

    setTasks((current) => sortTasks([optimisticTask, ...current]));
    bridgeRef.current.setSelectedSection(getTaskSection(optimisticTask));
    bridgeRef.current.setSelectedTaskId(optimisticTask.id);
    bridgeRef.current.setTitleFocusTaskId(optimisticTask.id);
    bridgeRef.current.setErrorMessage(null);

    try {
      const saved = await tasksApi.create({
        id: optimisticTask.id,
        ...toTaskDraftPayload(optimisticTask),
      });
      setTasks((current) => sortTasks(current.map((task) => (task.id === saved.id ? mergeTaskFromApi(saved) : task))));
    } catch (error) {
      const tr = tRef.current;
      bridgeRef.current.setErrorMessage(error instanceof Error ? error.message : tr('errors.createTask'));
      bridgeRef.current.setTitleFocusTaskId(null);
      await loadTasksAndAreas();
    }
  }

  async function handleDelete(taskId: string) {
    const previousTasks = tasks;
    const existingTimeout = saveTimersRef.current.get(taskId);
    if (existingTimeout) {
      window.clearTimeout(existingTimeout);
      saveTimersRef.current.delete(taskId);
    }
    pendingSavesRef.current.delete(taskId);
    saveRevRef.current.delete(taskId);
    setSavingFlag(taskId, false);

    setTasks((current) => current.filter((task) => task.id !== taskId));
    bridgeRef.current.setErrorMessage(null);

    try {
      await tasksApi.remove(taskId);
    } catch (error) {
      const tr = tRef.current;
      bridgeRef.current.setErrorMessage(error instanceof Error ? error.message : tr('errors.deleteTask'));
      setTasks(previousTasks);
    }
  }

  function handleToggleRecurringStatus(taskId: string) {
    handleTaskMutation(taskId, applyRecurringStatusToggle);
  }

  return {
    tasks,
    areas,
    savingIds,
    loadTasksAndAreas,
    refreshTasksAndAreas,
    handleAddTask,
    handleTaskDraftChange,
    handleToggleRecurringStatus,
    handleDelete,
  };
}
