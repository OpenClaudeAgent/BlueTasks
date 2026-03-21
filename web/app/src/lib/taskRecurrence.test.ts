import {describe, expect, it} from 'vitest';
import {addDaysToKey, todayKey} from './dateKeys';
import {createTask} from './tasks';
import type {Task} from '../types';
import {applyRecurringStatusToggle} from './taskRecurrence';

describe('applyRecurringStatusToggle', () => {
  it('advances due date instead of completing when recurrence is set', () => {
    const day = todayKey();
    const task: Task = {
      ...createTask('X'),
      id: 'r1',
      taskDate: day,
      recurrence: 'weekly',
    };
    const next = applyRecurringStatusToggle(task);
    expect(next.status).toBe('pending');
    expect(next.taskDate).toBe(addDaysToKey(day, 7));
  });

  it('toggles pending ↔ completed without recurrence', () => {
    const pending = {...createTask('S'), id: 'p1', recurrence: null};
    const done = applyRecurringStatusToggle(pending);
    expect(done.status).toBe('completed');
    expect(applyRecurringStatusToggle(done).status).toBe('pending');
  });
});
