/** @vitest-environment jsdom */
import {describe, expect, it, vi, beforeEach} from 'vitest';
import {act, renderHook, waitFor} from '@testing-library/react';
import {I18nextProvider} from 'react-i18next';
import i18n from '../i18n';
import {useBlueTasksBoard} from './useBlueTasksBoard';
import {todayKey} from '../lib/dateKeys';
import {createTask} from '../lib/tasks';
import {CATEGORY_FILTER_ALL} from '../types';

const mockUi = {
  categoryFilter: CATEGORY_FILTER_ALL,
  setCategoryFilter: vi.fn(),
  selectedSection: 'today' as const,
  setSelectedSection: vi.fn(),
  selectedTaskId: null as string | null,
  setSelectedTaskId: vi.fn(),
  titleFocusTaskId: null as string | null,
  setTitleFocusTaskId: vi.fn(),
  loading: false,
  setLoading: vi.fn(),
  errorMessage: null as string | null,
  setErrorMessage: vi.fn(),
};

const taskToday = {...createTask('T'), id: 't1', taskDate: todayKey()};

const mockCore = {
  tasks: [taskToday],
  categories: [] as {
    id: string;
    name: string;
    icon: 'folder';
    sortIndex: number;
    createdAt: string;
  }[],
  savingIds: {} as Record<string, boolean>,
  refreshTasksAndCategories: vi.fn(),
  handleAddTask: vi.fn(),
  handleQuickCapture: vi.fn(),
  handleTaskDraftChange: vi.fn(),
  handleToggleRecurringStatus: vi.fn(),
  handleDelete: vi.fn(),
};

vi.mock('./blueTasks/useBlueTasksUiState', () => ({
  useBlueTasksUiState: () => mockUi,
}));

vi.mock('./blueTasks/useBlueTasksTasksAndSaves', () => ({
  useBlueTasksTasksAndSaves: () => mockCore,
}));

describe('Feature: useBlueTasksBoard composition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUi.categoryFilter = CATEGORY_FILTER_ALL;
    mockUi.selectedSection = 'today';
    mockUi.loading = false;
    mockUi.errorMessage = null;
    mockUi.selectedTaskId = null;
    mockCore.tasks = [taskToday];
    mockCore.categories = [];
  });

  function renderBoard() {
    return renderHook(() => useBlueTasksBoard(), {
      wrapper: ({children}) => <I18nextProvider i18n={i18n}>{children}</I18nextProvider>,
    });
  }

  it('Scenario: Today section — visibleTasks filters by section and category', async () => {
    const {result} = renderBoard();
    await waitFor(() => {
      expect(result.current.visibleTasks.some((t) => t.id === 't1')).toBe(true);
    });
  });

  it('Scenario: Unknown category filter — effect resets to ALL when category missing', async () => {
    mockUi.categoryFilter = 'missing-category-id';
    mockCore.categories = [
      {id: 'real', name: 'R', icon: 'folder', sortIndex: 0, createdAt: '2025-01-01T00:00:00.000Z'},
    ];
    renderBoard();
    await waitFor(() => {
      expect(mockUi.setCategoryFilter).toHaveBeenCalledWith(CATEGORY_FILTER_ALL);
    });
  });

  it('Scenario: No visible tasks — selection updater clears selected task id', async () => {
    const {rerender} = renderBoard();
    await waitFor(() => {
      expect(mockUi.setSelectedTaskId).toHaveBeenCalled();
    });
    vi.clearAllMocks();
    mockCore.tasks = [];
    rerender();
    await waitFor(() => {
      expect(mockUi.setSelectedTaskId).toHaveBeenCalled();
    });
    const updater = mockUi.setSelectedTaskId.mock.calls.at(-1)?.[0];
    expect(typeof updater).toBe('function');
    expect((updater as (current: string | null) => string | null)('t1')).toBe(null);
  });

  it('Scenario: Date popover task — null when id not in visibleTasks', async () => {
    const {result} = renderBoard();
    await waitFor(() => {
      expect(result.current.visibleTasks.some((t) => t.id === 't1')).toBe(true);
    });
    act(() => {
      result.current.setDatePopoverTaskId('not-in-list');
    });
    expect(result.current.datePopoverTaskId).toBe(null);
  });

  it('Scenario: Date popover task — set when id matches a visible task', async () => {
    const {result} = renderBoard();
    await waitFor(() => {
      expect(result.current.visibleTasks.some((t) => t.id === 't1')).toBe(true);
    });
    act(() => {
      result.current.setDatePopoverTaskId('t1');
    });
    expect(result.current.datePopoverTaskId).toBe('t1');
  });

  it('Scenario: Selection sync — updater keeps id when task still visible', async () => {
    const {result} = renderBoard();
    await waitFor(() => {
      expect(result.current.visibleTasks.some((t) => t.id === 't1')).toBe(true);
    });
    const updater = mockUi.setSelectedTaskId.mock.calls.at(-1)?.[0] as (
      current: string | null,
    ) => string | null;
    expect(updater('t1')).toBe('t1');
  });

  it('Scenario: Selection sync — updater picks first visible when current missing', async () => {
    const {result} = renderBoard();
    await waitFor(() => {
      expect(result.current.visibleTasks.some((t) => t.id === 't1')).toBe(true);
    });
    const updater = mockUi.setSelectedTaskId.mock.calls.at(-1)?.[0] as (
      current: string | null,
    ) => string | null;
    expect(updater('ghost')).toBe('t1');
  });

  it('Scenario: Add task — calls core handleAddTask with current category filter', async () => {
    const {result} = renderBoard();
    await waitFor(() => {
      expect(result.current.visibleTasks.length).toBeGreaterThan(0);
    });
    result.current.handleAddTask();
    expect(mockCore.handleAddTask).toHaveBeenCalledWith(CATEGORY_FILTER_ALL);
  });

  it('Scenario: Task counts by category — includes tasks with categoryId', async () => {
    mockCore.tasks = [{...taskToday, categoryId: 'a1'}];
    const {result} = renderBoard();
    await waitFor(() => {
      expect(result.current.taskCountByCategoryId.a1).toBe(1);
    });
  });

  it('Scenario: Quick capture — forwards title, category filter and section to core', async () => {
    const {result} = renderBoard();
    await waitFor(() => {
      expect(result.current.visibleTasks.length).toBeGreaterThan(0);
    });
    result.current.handleQuickCapture('Inbox note');
    expect(mockCore.handleQuickCapture).toHaveBeenCalledWith(
      'Inbox note',
      CATEGORY_FILTER_ALL,
      'today',
    );
  });
});
