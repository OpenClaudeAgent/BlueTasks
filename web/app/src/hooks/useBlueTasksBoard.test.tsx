/** @vitest-environment jsdom */
import {describe, expect, it, vi, beforeEach} from 'vitest';
import {renderHook, waitFor} from '@testing-library/react';
import {I18nextProvider} from 'react-i18next';
import i18n from '../i18n';
import {useBlueTasksBoard} from './useBlueTasksBoard';
import {todayKey} from '../lib/dateKeys';
import {createTask} from '../lib/tasks';
import {AREA_FILTER_ALL} from '../types';

const mockUi = {
  areaFilter: AREA_FILTER_ALL,
  setAreaFilter: vi.fn(),
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
  areas: [] as {id: string; name: string; icon: 'folder'; sortIndex: number; createdAt: string}[],
  savingIds: {} as Record<string, boolean>,
  refreshTasksAndAreas: vi.fn(),
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
    mockUi.areaFilter = AREA_FILTER_ALL;
    mockUi.selectedSection = 'today';
    mockUi.loading = false;
    mockUi.errorMessage = null;
    mockUi.selectedTaskId = null;
    mockCore.tasks = [taskToday];
    mockCore.areas = [];
  });

  function renderBoard() {
    return renderHook(() => useBlueTasksBoard(), {
      wrapper: ({children}) => <I18nextProvider i18n={i18n}>{children}</I18nextProvider>,
    });
  }

  it('Scenario: Today section — visibleTasks filters by section and area', async () => {
    const {result} = renderBoard();
    await waitFor(() => {
      expect(result.current.visibleTasks.some((t) => t.id === 't1')).toBe(true);
    });
  });

  it('Scenario: Unknown area filter — effect resets to ALL when area missing', async () => {
    mockUi.areaFilter = 'missing-area-id';
    mockCore.areas = [{id: 'real', name: 'R', icon: 'folder', sortIndex: 0, createdAt: '2025-01-01T00:00:00.000Z'}];
    renderBoard();
    await waitFor(() => {
      expect(mockUi.setAreaFilter).toHaveBeenCalledWith(AREA_FILTER_ALL);
    });
  });
});
