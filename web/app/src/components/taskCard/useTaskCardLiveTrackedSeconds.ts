import {useEffect, useState} from 'react';
import {formatTrackedSeconds} from '../../lib/taskCardFormat';
import type {Task} from '../../types';

/** Re-render once per second while `timerStartedAt` is set so duration labels stay live. */
export function useTaskCardLiveTrackedSeconds(task: Task): number {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!task.timerStartedAt) {
      return;
    }
    const id = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [task.timerStartedAt, task.id]);

  return formatTrackedSeconds(task, Date.now());
}
