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
import {addDaysToKey, todayKey} from '../../lib/date';
import {AREA_FILTER_ALL} from '../../types';
import {tasksApi, areasApi} from '../../api';

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
});
