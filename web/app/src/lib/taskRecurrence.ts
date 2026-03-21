import {todayKey} from './dateKeys';
import {advanceRecurrenceDate} from './recurrence';
import type {Task} from '../types';

/** When marking "done", a recurring task advances the due date instead of becoming completed. */
export function applyRecurringStatusToggle(task: Task): Task {
  if (task.status !== 'pending' || !task.recurrence) {
    return {
      ...task,
      status: task.status === 'completed' ? 'pending' : 'completed',
    };
  }

  const base = task.taskDate ?? todayKey();
  return {
    ...task,
    taskDate: advanceRecurrenceDate(base, task.recurrence),
    status: 'pending',
  };
}
