/** @vitest-environment jsdom */
import {describe, expect, it, vi} from 'vitest';
import {useState} from 'react';
import {act, renderHook} from '@testing-library/react';
import {createTask} from '../../lib/tasks';
import type {TaskCardBoardChrome} from './useTaskCardChrome';
import {useTaskCardChrome} from './useTaskCardChrome';

function renderTaskCardChromeHook(task: ReturnType<typeof createTask>, language = 'en-US') {
  const onChange = vi.fn();
  const onDelete = vi.fn();
  const {result} = renderHook(() => {
    const [datePopoverTaskId, setDatePopoverTaskId] = useState<string | null>(null);
    const board: TaskCardBoardChrome = {
      datePopoverTaskId,
      setDatePopoverTaskId,
      liveTimerNowMs: 0,
    };
    return useTaskCardChrome(task, [], language, false, onChange, onDelete, board);
  });
  return {result, onChange, onDelete};
}

describe('useTaskCardChrome', () => {
  it('exposes footerProps aligned with task id and coerced pinned', () => {
    const task = {...createTask('Hello'), id: 't-1', pinned: 1 as unknown as boolean};
    const {result} = renderTaskCardChromeHook(task);

    expect(result.current.footerProps.taskId).toBe('t-1');
    expect(result.current.footerProps.taskTitle).toBe('Hello');
    expect(result.current.pinned).toBe(true);
    expect(result.current.footerProps.pinned).toBe(true);
  });

  it('updateDate clears recurrence and closes popover state', () => {
    const task = {...createTask('R'), id: 'r-fixed'};
    const {result, onChange} = renderTaskCardChromeHook(task);

    act(() => {
      result.current.setDateOpen(true);
    });
    expect(result.current.dateOpen).toBe(true);

    act(() => {
      result.current.updateDate('2025-03-01');
    });

    expect(onChange).toHaveBeenCalledWith('r-fixed', {taskDate: '2025-03-01', recurrence: null});
    expect(result.current.dateOpen).toBe(false);
  });

  it('uses French day picker locale when language is fr', () => {
    const task = {...createTask('L'), id: 'l-fixed'};
    const {result} = renderTaskCardChromeHook(task, 'fr');

    expect(result.current.dayPickerLocale.code).toBe('fr');
  });
});
