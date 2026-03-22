import {useCallback, useEffect, useRef, useState} from 'react';
import type {TFunction} from 'i18next';
import {areasApi, tasksApi} from '../../api';
import {addDaysToKey, todayKey} from '../../lib/dateKeys';
import {coerceAreaIcon} from '../../lib/areaIcons';
import {applyRecurringStatusToggle} from '../../lib/taskRecurrence';
import {
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
  const tasksRef = useRef<Task[]>(tasks);
  tasksRef.current = tasks;

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

  const persistOptimisticNewTask = useCallback(
    async (
      optimisticTask: Task,
      options: {titleFocusTaskId: string | null; clearTitleFocusOnError: boolean},
    ) => {
      setTasks((current) => sortTasks([optimisticTask, ...current]));
      bridgeRef.current.setSelectedSection(getTaskSection(optimisticTask));
      bridgeRef.current.setSelectedTaskId(optimisticTask.id);
      bridgeRef.current.setTitleFocusTaskId(options.titleFocusTaskId);
      bridgeRef.current.setErrorMessage(null);

      try {
        const saved = await tasksApi.create({
          id: optimisticTask.id,
          ...toTaskDraftPayload(optimisticTask),
        });
        setTasks((current) =>
          sortTasks(current.map((task) => (task.id === saved.id ? mergeTaskFromApi(saved as Task) : task))),
        );
      } catch (error) {
        const tr = tRef.current;
        bridgeRef.current.setErrorMessage(error instanceof Error ? error.message : tr('errors.createTask'));
        if (options.clearTitleFocusOnError) {
          bridgeRef.current.setTitleFocusTaskId(null);
        }
        await loadTasksAndAreas();
      }
    },
    [loadTasksAndAreas],
  );

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
    const pendingTimer = saveTimersRef.current.get(taskId);
    if (pendingTimer !== undefined) {
      window.clearTimeout(pendingTimer);
    }
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
    const current = tasksRef.current;
    const currentTask = current.find((task) => task.id === taskId);
    if (!currentTask) {
      return;
    }

    const nextTask: Task = {
      ...mutate(currentTask),
      updatedAt: new Date().toISOString(),
    };

    const sorted = sortTasks(current.map((task) => (task.id === taskId ? nextTask : task)));
    setTasks(sorted);
    tasksRef.current = sorted;

    scheduleSave(nextTask);
    if (currentTask.status !== nextTask.status) {
      flushSave(nextTask.id);
    }
  }

  const handleTaskMutationRef = useRef(handleTaskMutation);
  handleTaskMutationRef.current = handleTaskMutation;

  const handleTaskDraftChange = useCallback((taskId: string, update: TaskDraftUpdate) => {
    handleTaskMutationRef.current(taskId, (current) => ({
      ...current,
      ...update,
    }));
  }, []);

  const handleToggleRecurringStatus = useCallback((taskId: string) => {
    handleTaskMutationRef.current(taskId, applyRecurringStatusToggle);
  }, []);

  const handleAddTask = useCallback(
    async (areaFilter: AreaFilter) => {
      const captureAreaId =
        areaFilter !== AREA_FILTER_ALL && areaFilter !== AREA_FILTER_UNCATEGORIZED ? areaFilter : null;
      const optimisticTask = createTask('', captureAreaId);
      await persistOptimisticNewTask(optimisticTask, {
        titleFocusTaskId: optimisticTask.id,
        clearTitleFocusOnError: true,
      });
    },
    [persistOptimisticNewTask],
  );

  /** Header quick capture: title preset, optional default date from active section (Today / Upcoming). */
  const handleQuickCapture = useCallback(
    async (rawTitle: string, areaFilter: AreaFilter, sectionHint: SectionId) => {
      const title = rawTitle.trim();
      if (!title) {
        return;
      }

      const captureAreaId =
        areaFilter !== AREA_FILTER_ALL && areaFilter !== AREA_FILTER_UNCATEGORIZED ? areaFilter : null;

      let taskDate: string | null = null;
      if (sectionHint === 'today') {
        taskDate = todayKey();
      } else if (sectionHint === 'upcoming') {
        taskDate = addDaysToKey(todayKey(), 1);
      }

      const optimisticBase = createTask(title, captureAreaId);
      const optimisticTask: Task = {
        ...optimisticBase,
        taskDate,
      };

      await persistOptimisticNewTask(optimisticTask, {
        titleFocusTaskId: null,
        clearTitleFocusOnError: false,
      });
    },
    [persistOptimisticNewTask],
  );

  const handleDelete = useCallback(async (taskId: string) => {
    const previousTasks = tasksRef.current;
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
  }, []);

  return {
    tasks,
    areas,
    savingIds,
    loadTasksAndAreas,
    refreshTasksAndAreas,
    handleAddTask,
    handleQuickCapture,
    handleTaskDraftChange,
    handleToggleRecurringStatus,
    handleDelete,
  };
}
