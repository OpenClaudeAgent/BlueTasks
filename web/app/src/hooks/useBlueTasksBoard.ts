import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {areasApi, tasksApi} from '../api';
import {coerceAreaIcon} from '../lib/areaIcons';
import {
  applyRecurringStatusToggle,
  applySavedTaskPreservingLexicalShape,
  createTask,
  filterTasks,
  getTaskCounts,
  getTaskSection,
  isSaveSuperseded,
  mergeTaskFromApi,
  sortTasks,
  toTaskDraftPayload,
} from '../lib/tasks';
import {AREA_FILTER_ALL, AREA_FILTER_UNCATEGORIZED} from '../types';
import type {Area, AreaFilter, SectionId, Task, TaskDraftPayload, TaskDraftUpdate} from '../types';

const SAVE_DELAY_MS = 520;

type PendingTaskSave = {
  payload: TaskDraftPayload;
  rev: number;
};

export function useBlueTasksBoard() {
  const {t} = useTranslation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [areaFilter, setAreaFilter] = useState<AreaFilter>(AREA_FILTER_ALL);
  const [selectedSection, setSelectedSection] = useState<SectionId>('today');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [titleFocusTaskId, setTitleFocusTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({});
  const pendingSavesRef = useRef(new Map<string, PendingTaskSave>());
  const saveRevRef = useRef(new Map<string, number>());
  const saveTimersRef = useRef(new Map<string, number>());
  const flushChainsRef = useRef(new Map<string, Promise<void>>());

  const fetchAndApplyLists = useCallback(async () => {
    const [nextTasks, nextAreas] = await Promise.all([tasksApi.list(), areasApi.list()]);
    setTasks(sortTasks(nextTasks.map((task) => mergeTaskFromApi(task as Task))));
    setAreas(nextAreas.map((a) => ({...a, icon: coerceAreaIcon(a.icon)})));
    setErrorMessage(null);
  }, []);

  const loadTasksAndAreas = useCallback(async () => {
    try {
      setLoading(true);
      await fetchAndApplyLists();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('errors.loadTasks'));
    } finally {
      setLoading(false);
    }
  }, [t, fetchAndApplyLists]);

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

  const visibleTasks = useMemo(
    () => filterTasks(tasks, selectedSection, areaFilter),
    [tasks, selectedSection, areaFilter],
  );
  const counts = useMemo(() => getTaskCounts(tasks, areaFilter), [tasks, areaFilter]);

  const taskCountByAreaId = useMemo(() => {
    const map: Record<string, number> = {};
    for (const task of tasks) {
      if (task.areaId) {
        map[task.areaId] = (map[task.areaId] ?? 0) + 1;
      }
    }
    return map;
  }, [tasks]);

  const areaSidebarCounts = useMemo(() => {
    const byId: Record<string, number> = {};
    for (const area of areas) {
      byId[area.id] = filterTasks(tasks, selectedSection, area.id).length;
    }
    return {
      all: filterTasks(tasks, selectedSection, AREA_FILTER_ALL).length,
      uncategorized: filterTasks(tasks, selectedSection, AREA_FILTER_UNCATEGORIZED).length,
      byId,
    };
  }, [tasks, selectedSection, areas]);

  useEffect(() => {
    if (areaFilter === AREA_FILTER_ALL || areaFilter === AREA_FILTER_UNCATEGORIZED) {
      return;
    }
    if (!areas.some((a) => a.id === areaFilter)) {
      setAreaFilter(AREA_FILTER_ALL);
    }
  }, [areas, areaFilter]);

  useEffect(() => {
    setSelectedTaskId((current) => {
      if (!visibleTasks.length) {
        return null;
      }

      if (current && visibleTasks.some((task) => task.id === current)) {
        return current;
      }

      return current === null ? null : visibleTasks[0].id;
    });
  }, [visibleTasks]);

  const refreshTasksAndAreas = useCallback(async () => {
    try {
      await fetchAndApplyLists();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('errors.loadTasks'));
    }
  }, [t, fetchAndApplyLists]);

  async function handleAddTask() {
    const captureAreaId =
      areaFilter !== AREA_FILTER_ALL && areaFilter !== AREA_FILTER_UNCATEGORIZED ? areaFilter : null;
    const optimisticTask = createTask('', captureAreaId);

    setTasks((current) => sortTasks([optimisticTask, ...current]));
    setSelectedSection(getTaskSection(optimisticTask));
    setSelectedTaskId(optimisticTask.id);
    setTitleFocusTaskId(optimisticTask.id);
    setErrorMessage(null);

    try {
      const saved = await tasksApi.create({
        id: optimisticTask.id,
        ...toTaskDraftPayload(optimisticTask),
      });
      setTasks((current) => sortTasks(current.map((task) => (task.id === saved.id ? mergeTaskFromApi(saved) : task))));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('errors.createTask'));
      setTitleFocusTaskId(null);
      await loadTasksAndAreas();
    }
  }

  function handleTaskDraftChange(taskId: string, update: TaskDraftUpdate) {
    handleTaskMutation(taskId, (current) => ({
      ...current,
      ...update,
    }));
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
            setErrorMessage(null);
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
          setErrorMessage(null);
        } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : t('errors.updateTask'));
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
    setErrorMessage(null);

    try {
      await tasksApi.remove(taskId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('errors.deleteTask'));
      setTasks(previousTasks);
    }
  }

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

  function handleToggleRecurringStatus(taskId: string) {
    handleTaskMutation(taskId, applyRecurringStatusToggle);
  }

  return {
    areas,
    areaFilter,
    setAreaFilter,
    selectedSection,
    setSelectedSection,
    selectedTaskId,
    setSelectedTaskId,
    titleFocusTaskId,
    setTitleFocusTaskId,
    loading,
    errorMessage,
    savingIds,
    visibleTasks,
    counts,
    taskCountByAreaId,
    areaSidebarCounts,
    refreshTasksAndAreas,
    handleAddTask,
    handleTaskDraftChange,
    handleToggleRecurringStatus,
    handleDelete,
  };
}
