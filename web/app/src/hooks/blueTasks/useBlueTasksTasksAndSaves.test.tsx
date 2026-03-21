/** @vitest-environment jsdom */
import type {ReactNode} from 'react';
import {describe, expect, it, vi, beforeEach, afterEach} from 'vitest';
import {act, renderHook, waitFor} from '@testing-library/react';
import {I18nextProvider} from 'react-i18next';
import {useTranslation} from 'react-i18next';
import i18n from '../../i18n';
import {useBlueTasksTasksAndSaves} from './useBlueTasksTasksAndSaves';
import type {BlueTasksUiBridge} from './useBlueTasksTasksAndSaves';

vi.mock('../../api', () => ({
  tasksApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
  areasApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

import {createTask, mergeTaskFromApi} from '../../lib/tasks';
import {addDaysToKey, todayKey} from '../../lib/dateKeys';
import {AREA_FILTER_ALL} from '../../types';
import {tasksApi, areasApi} from '../../api';
import {SAVE_DELAY_MS} from './constants';

function wrapper({children}: {children: ReactNode}) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

describe('Feature: useBlueTasksTasksAndSaves', () => {
  const bridge: BlueTasksUiBridge = {
    setLoading: vi.fn(),
    setErrorMessage: vi.fn(),
    setSelectedSection: vi.fn(),
    setSelectedTaskId: vi.fn(),
    setTitleFocusTaskId: vi.fn(),
  };

  beforeEach(() => {
    vi.mocked(tasksApi.list).mockResolvedValue([]);
    vi.mocked(areasApi.list).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('Scenario: Mount — loads tasks and areas then clears loading', async () => {
    const {result} = renderHook(
      () => {
        const {t} = useTranslation();
        return useBlueTasksTasksAndSaves(bridge, t);
      },
      {wrapper},
    );

    await waitFor(() => {
      expect(tasksApi.list).toHaveBeenCalled();
      expect(areasApi.list).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(bridge.setLoading).toHaveBeenCalledWith(false);
    });
    expect(result.current.tasks).toEqual([]);
  });

  it('Scenario: Load failure — sets error message and stops loading', async () => {
    vi.mocked(tasksApi.list).mockRejectedValue(new Error('offline'));
    renderHook(
      () => {
        const {t} = useTranslation();
        return useBlueTasksTasksAndSaves(bridge, t);
      },
      {wrapper},
    );

    await waitFor(() => {
      expect(bridge.setErrorMessage).toHaveBeenCalledWith('offline');
    });
    await waitFor(() => {
      expect(bridge.setLoading).toHaveBeenCalledWith(false);
    });
  });

  it('Scenario: Add task — POST succeeds and replaces optimistic row', async () => {
    vi.mocked(tasksApi.list).mockResolvedValue([]);
    vi.mocked(areasApi.list).mockResolvedValue([]);
    const {result} = renderHook(
      () => {
        const {t} = useTranslation();
        return useBlueTasksTasksAndSaves(bridge, t);
      },
      {wrapper},
    );
    await waitFor(() => expect(bridge.setLoading).toHaveBeenCalledWith(false));

    vi.mocked(tasksApi.create).mockImplementation(async (payload) =>
      mergeTaskFromApi({...(createTask('Saved') as never), ...payload, title: 'Saved'} as never),
    );

    await act(async () => {
      await result.current.handleAddTask(AREA_FILTER_ALL);
    });

    expect(tasksApi.create).toHaveBeenCalled();
    await waitFor(() => {
      expect(result.current.tasks.some((t) => t.title === 'Saved')).toBe(true);
    });
  });

  it('Scenario: Delete task — remove succeeds and list drops row', async () => {
    const row = mergeTaskFromApi({...createTask('X'), id: 'del-1'} as never);
    vi.mocked(tasksApi.list).mockResolvedValue([row as never]);
    vi.mocked(areasApi.list).mockResolvedValue([]);
    vi.mocked(tasksApi.remove).mockResolvedValue(undefined);

    const {result} = renderHook(
      () => {
        const {t} = useTranslation();
        return useBlueTasksTasksAndSaves(bridge, t);
      },
      {wrapper},
    );
    await waitFor(() => expect(result.current.tasks.length).toBe(1));

    await act(async () => {
      await result.current.handleDelete('del-1');
    });

    expect(tasksApi.remove).toHaveBeenCalledWith('del-1');
    expect(result.current.tasks.find((t) => t.id === 'del-1')).toBeUndefined();
  });

  it('Scenario: Quick capture on Today — creates task with today date', async () => {
    vi.mocked(tasksApi.list).mockResolvedValue([]);
    vi.mocked(areasApi.list).mockResolvedValue([]);
    vi.mocked(tasksApi.create).mockImplementation(async (payload) =>
      mergeTaskFromApi({...(createTask('QC') as never), ...payload} as never),
    );

    const {result} = renderHook(
      () => {
        const {t} = useTranslation();
        return useBlueTasksTasksAndSaves(bridge, t);
      },
      {wrapper},
    );
    await waitFor(() => expect(bridge.setLoading).toHaveBeenCalledWith(false));

    await act(async () => {
      await result.current.handleQuickCapture('QC title', AREA_FILTER_ALL, 'today');
    });

    expect(tasksApi.create).toHaveBeenCalled();
    const call = vi.mocked(tasksApi.create).mock.calls[0]?.[0] as {taskDate: string | null; title?: string};
    expect(call.taskDate).toBe(todayKey());
  });

  it('Scenario: Quick capture on Upcoming — uses tomorrow key', async () => {
    vi.mocked(tasksApi.list).mockResolvedValue([]);
    vi.mocked(areasApi.list).mockResolvedValue([]);
    vi.mocked(tasksApi.create).mockImplementation(async (payload) =>
      mergeTaskFromApi({...(createTask('U') as never), ...payload} as never),
    );

    const {result} = renderHook(
      () => {
        const {t} = useTranslation();
        return useBlueTasksTasksAndSaves(bridge, t);
      },
      {wrapper},
    );
    await waitFor(() => expect(bridge.setLoading).toHaveBeenCalledWith(false));

    await act(async () => {
      await result.current.handleQuickCapture('Future', AREA_FILTER_ALL, 'upcoming');
    });

    const call = vi.mocked(tasksApi.create).mock.calls[0]?.[0] as {taskDate: string | null};
    expect(call.taskDate).toBe(addDaysToKey(todayKey(), 1));
  });

  it('Scenario: Quick capture with blank or whitespace only — does not call create', async () => {
    const {result} = renderHook(
      () => {
        const {t} = useTranslation();
        return useBlueTasksTasksAndSaves(bridge, t);
      },
      {wrapper},
    );
    await waitFor(() => expect(bridge.setLoading).toHaveBeenCalledWith(false));

    await act(async () => {
      await result.current.handleQuickCapture('', AREA_FILTER_ALL, 'today');
    });
    await act(async () => {
      await result.current.handleQuickCapture('   \t\n', AREA_FILTER_ALL, 'today');
    });

    expect(tasksApi.create).not.toHaveBeenCalled();
  });

  it('Scenario: Refresh lists fails — bridge receives the error message', async () => {
    const {result} = renderHook(
      () => {
        const {t} = useTranslation();
        return useBlueTasksTasksAndSaves(bridge, t);
      },
      {wrapper},
    );
    await waitFor(() => expect(bridge.setLoading).toHaveBeenCalledWith(false));

    vi.mocked(tasksApi.list).mockRejectedValueOnce(new Error('refresh failed'));

    await act(async () => {
      await result.current.refreshTasksAndAreas();
    });

    expect(bridge.setErrorMessage).toHaveBeenCalledWith('refresh failed');
  });

  it('Scenario: User edits a task — debounced save calls update after delay', async () => {
    const row = mergeTaskFromApi({...createTask('Before'), id: 'edit-1'} as never);
    vi.mocked(tasksApi.list).mockResolvedValue([row as never]);
    vi.mocked(areasApi.list).mockResolvedValue([]);
    vi.mocked(tasksApi.update).mockImplementation(async (_id, payload) =>
      mergeTaskFromApi({...(row as never), ...payload, title: 'After'} as never),
    );

    const {result} = renderHook(
      () => {
        const {t} = useTranslation();
        return useBlueTasksTasksAndSaves(bridge, t);
      },
      {wrapper},
    );
    await waitFor(() => expect(result.current.tasks.some((t) => t.id === 'edit-1')).toBe(true));

    vi.useFakeTimers();

    await act(async () => {
      result.current.handleTaskDraftChange('edit-1', {title: 'After'});
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(SAVE_DELAY_MS + 80);
    });
    vi.useRealTimers();

    await waitFor(() => {
      expect(tasksApi.update).toHaveBeenCalledWith(
        'edit-1',
        expect.objectContaining({title: 'After'}),
      );
    });
  });

  it('Scenario: Toggle recurring on a recurring task — debounced update persists recurrence change', async () => {
    const row = mergeTaskFromApi({
      ...createTask('Weekly'),
      id: 'rec-1',
      recurrence: 'weekly',
      taskDate: todayKey(),
    } as never);
    vi.mocked(tasksApi.list).mockResolvedValue([row as never]);
    vi.mocked(areasApi.list).mockResolvedValue([]);
    vi.mocked(tasksApi.update).mockImplementation(async (id, payload) =>
      mergeTaskFromApi({...(row as never), ...payload, id} as never),
    );

    const {result} = renderHook(
      () => {
        const {t} = useTranslation();
        return useBlueTasksTasksAndSaves(bridge, t);
      },
      {wrapper},
    );
    await waitFor(() => expect(result.current.tasks.some((t) => t.id === 'rec-1')).toBe(true));

    vi.useFakeTimers();

    await act(async () => {
      result.current.handleToggleRecurringStatus('rec-1');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(SAVE_DELAY_MS + 80);
    });
    vi.useRealTimers();

    await waitFor(() => {
      expect(tasksApi.update).toHaveBeenCalledWith('rec-1', expect.any(Object));
    });
    const updatePayload = vi.mocked(tasksApi.update).mock.calls[0]?.[1] as {taskDate: string | null};
    expect(updatePayload.taskDate).not.toBe(row.taskDate);
    expect(updatePayload.taskDate).toBeTruthy();
  });

  it('Scenario: Delete task — when remove rejects, task is restored and error is set', async () => {
    const row = mergeTaskFromApi({...createTask('Keep'), id: 'del-fail-1'} as never);
    vi.mocked(tasksApi.list).mockResolvedValue([row as never]);
    vi.mocked(areasApi.list).mockResolvedValue([]);
    vi.mocked(tasksApi.remove).mockRejectedValue(new Error('delete blocked'));

    const {result} = renderHook(
      () => {
        const {t} = useTranslation();
        return useBlueTasksTasksAndSaves(bridge, t);
      },
      {wrapper},
    );
    await waitFor(() => expect(result.current.tasks.length).toBe(1));

    await act(async () => {
      await result.current.handleDelete('del-fail-1');
    });

    expect(bridge.setErrorMessage).toHaveBeenCalledWith('delete blocked');
    expect(result.current.tasks.find((t) => t.id === 'del-fail-1')).toBeDefined();
    expect(tasksApi.remove).toHaveBeenCalledWith('del-fail-1');
  });
});
