import {useCallback, useEffect, useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {filterTasks, getCategorySidebarCounts, getTaskCounts} from '../lib/tasks';
import {CATEGORY_FILTER_ALL, CATEGORY_FILTER_UNCATEGORIZED} from '../types';
import {useBlueTasksTasksAndSaves} from './blueTasks/useBlueTasksTasksAndSaves';
import {useBlueTasksUiState} from './blueTasks/useBlueTasksUiState';
import {useBoardTimerNowMs} from './useBoardTimerNowMs';

/**
 * Composes UI state + tasks/categories persistence. See `useBlueTasksUiState` and `useBlueTasksTasksAndSaves`.
 */
export function useBlueTasksBoard() {
  const {t} = useTranslation();
  const [rawDatePopoverTaskId, setDatePopoverTaskId] = useState<string | null>(null);
  const ui = useBlueTasksUiState();
  const {
    categoryFilter,
    setCategoryFilter,
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
    categories,
    savingIds,
    refreshTasksAndCategories,
    handleAddTask,
    handleQuickCapture,
    handleTaskDraftChange,
    handleToggleRecurringStatus,
    handleDelete,
  } = core;

  const visibleTasks = useMemo(
    () => filterTasks(tasks, selectedSection, categoryFilter),
    [tasks, selectedSection, categoryFilter],
  );

  const liveTimerNowMs = useBoardTimerNowMs(visibleTasks);
  const datePopoverTaskId =
    rawDatePopoverTaskId !== null && visibleTasks.some((task) => task.id === rawDatePopoverTaskId)
      ? rawDatePopoverTaskId
      : null;
  const counts = useMemo(() => getTaskCounts(tasks, categoryFilter), [tasks, categoryFilter]);

  const taskCountByCategoryId = useMemo(() => {
    const map: Record<string, number> = {};
    for (const task of tasks) {
      if (task.categoryId) {
        map[task.categoryId] = (map[task.categoryId] ?? 0) + 1;
      }
    }
    return map;
  }, [tasks]);

  const categorySidebarCounts = useMemo(
    () => getCategorySidebarCounts(tasks, selectedSection, categories),
    [tasks, selectedSection, categories],
  );

  const handleAddTaskForCurrentCategory = useCallback(() => {
    void handleAddTask(categoryFilter);
  }, [handleAddTask, categoryFilter]);

  const handleQuickCaptureInContext = useCallback(
    (title: string) => handleQuickCapture(title, categoryFilter, selectedSection),
    [handleQuickCapture, categoryFilter, selectedSection],
  );

  const toggleTaskExpanded = useCallback(
    (taskId: string) => {
      setSelectedTaskId((current) => (current === taskId ? null : taskId));
    },
    [setSelectedTaskId],
  );

  const clearTitleFocusTaskId = useCallback(() => {
    setTitleFocusTaskId(null);
  }, [setTitleFocusTaskId]);

  useEffect(() => {
    if (categoryFilter === CATEGORY_FILTER_ALL || categoryFilter === CATEGORY_FILTER_UNCATEGORIZED) {
      return;
    }
    if (!categories.some((c) => c.id === categoryFilter)) {
      setCategoryFilter(CATEGORY_FILTER_ALL);
    }
  }, [categories, categoryFilter, setCategoryFilter]);

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
    categories,
    categoryFilter,
    setCategoryFilter,
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
    taskCountByCategoryId,
    categorySidebarCounts,
    refreshTasksAndCategories,
    handleAddTask: handleAddTaskForCurrentCategory,
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
