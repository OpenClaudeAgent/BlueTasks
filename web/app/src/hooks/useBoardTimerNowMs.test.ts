/** @vitest-environment jsdom */
import {describe, expect, it, vi, afterEach} from 'vitest';
import {renderHook} from '@testing-library/react';
import {createTask} from '../lib/tasks';
import {useBoardTimerNowMs} from './useBoardTimerNowMs';

describe('useBoardTimerNowMs', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns 0 and does not start an interval when no task has an active timer', () => {
    vi.useFakeTimers();
    const task = createTask('A');
    const {result} = renderHook(() => useBoardTimerNowMs([task]));
    expect(result.current).toBe(0);
    vi.advanceTimersByTime(5000);
    expect(result.current).toBe(0);
  });

  it('ticks when at least one visible task has timerStartedAt set', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T12:00:00.000Z'));
    const task = {...createTask('T'), id: 't1', timerStartedAt: '2025-01-01T11:59:00.000Z'};
    const {result, rerender} = renderHook(({tasks}) => useBoardTimerNowMs(tasks), {
      initialProps: {tasks: [task]},
    });
    expect(result.current).toBeGreaterThan(0);
    const first = result.current;
    vi.advanceTimersByTime(1000);
    rerender({tasks: [task]});
    expect(result.current).toBeGreaterThanOrEqual(first);
  });
});
