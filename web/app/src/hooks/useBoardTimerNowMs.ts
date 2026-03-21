import {useEffect, useState} from 'react';
import type {Task} from '../types';

/** Single wall clock for all visible cards with an active timer (avoids N intervals). */
export function useBoardTimerNowMs(tasks: Task[]): number {
  const hasActiveTimer = tasks.some((t) => Boolean(t.timerStartedAt));
  const [nowMs, setNowMs] = useState(0);

  useEffect(() => {
    if (!hasActiveTimer) {
      return;
    }
    const tick = () => setNowMs(Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [hasActiveTimer]);

  return hasActiveTimer ? nowMs : 0;
}
