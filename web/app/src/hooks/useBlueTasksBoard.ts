import {useCallback, useEffect, useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {filterTasks, getAreaSidebarCounts, getTaskCounts} from '../lib/tasks';
import {AREA_FILTER_ALL, AREA_FILTER_UNCATEGORIZED} from '../types';
import {useBlueTasksTasksAndSaves} from './blueTasks/useBlueTasksTasksAndSaves';
import {useBlueTasksUiState} from './blueTasks/useBlueTasksUiState';
import {useBoardTimerNowMs} from './useBoardTimerNowMs';

/**
 * Composes UI state + tasks/areas persistence. See `useBlueTasksUiState` and `useBlueTasksTasksAndSaves`.
 */
export function useBlueTasksBoard() {
  const {t} = useTranslation();
  const [rawDatePopoverTaskId, setDatePopoverTaskId] = useState<string | null>(null);
  const ui = useBlueTasksUiState();
  const {
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
  } = ui;

  const core = useBlueTasksTasksAndSaves(
    {
      setLoading: ui.setLoading,
      setErrorMessage: ui.setErrorMessage,
      setSelectedSection: ui.setSelectedSection,
      setSelectedTaskId: ui.setSelectedTaskId,
      setTitleFocusTaskId: ui.setTitleFocusTaskId,
    },
    t,
  );

  const {
    tasks,
    areas,
    savingIds,
    refreshTasksAndAreas,
    handleAddTask,
    handleQuickCapture,
    handleTaskDraftChange,
    handleToggleRecurringStatus,
    handleDelete,
  } = core;

  const visibleTasks = useMemo(
    () => filterTasks(tasks, selectedSection, areaFilter),
    [tasks, selectedSection, areaFilter],
  );

  const liveTimerNowMs = useBoardTimerNowMs(visibleTasks);
  const datePopoverTaskId =
    rawDatePopoverTaskId !== null && visibleTasks.some((task) => task.id === rawDatePopoverTaskId)
      ? rawDatePopoverTaskId
      : null;
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

  const areaSidebarCounts = useMemo(
    () => getAreaSidebarCounts(tasks, selectedSection, areas),
    [tasks, selectedSection, areas],
  );

  const handleAddTaskForCurrentArea = useCallback(() => {
    void handleAddTask(areaFilter);
  }, [handleAddTask, areaFilter]);

  const handleQuickCaptureInContext = useCallback(
    (title: string) => handleQuickCapture(title, areaFilter, selectedSection),
    [handleQuickCapture, areaFilter, selectedSection],
  );

  const toggleTaskExpanded = useCallback((taskId: string) => {
    setSelectedTaskId((current) => (current === taskId ? null : taskId));
  }, [setSelectedTaskId]);

  const clearTitleFocusTaskId = useCallback(() => {
    setTitleFocusTaskId(null);
  }, [setTitleFocusTaskId]);

  useEffect(() => {
    if (areaFilter === AREA_FILTER_ALL || areaFilter === AREA_FILTER_UNCATEGORIZED) {
      return;
    }
    if (!areas.some((a) => a.id === areaFilter)) {
      setAreaFilter(AREA_FILTER_ALL);
    }
  }, [areas, areaFilter, setAreaFilter]);

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
  }, [visibleTasks, setSelectedTaskId]);

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
    handleAddTask: handleAddTaskForCurrentArea,
    handleQuickCapture: handleQuickCaptureInContext,
    handleTaskDraftChange,
    handleToggleRecurringStatus,
    handleDelete,
    toggleTaskExpanded,
    clearTitleFocusTaskId,
    datePopoverTaskId,
    setDatePopoverTaskId,
    liveTimerNowMs,
  };
}
