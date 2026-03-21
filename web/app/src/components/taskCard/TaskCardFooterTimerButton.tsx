import {useRef, type MouseEvent} from 'react';
import {Timer} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {formatDurationLabel} from '../../lib/taskCardFormat';
import type {Task, TaskDraftUpdate} from '../../types';

export type TaskCardFooterTimerButtonProps = {
  task: Task;
  trackedSeconds: number;
  onChange: (taskId: string, update: TaskDraftUpdate) => void;
};

export function TaskCardFooterTimerButton({task, trackedSeconds, onChange}: TaskCardFooterTimerButtonProps) {
  const {t} = useTranslation();
  const lastToggleAtRef = useRef(0);

  function toggleTimer(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    const now = Date.now();
    if (now - lastToggleAtRef.current < 500) {
      return;
    }
    lastToggleAtRef.current = now;

    if (task.timerStartedAt) {
      const start = Date.parse(task.timerStartedAt);
      const add = Number.isNaN(start) ? 0 : Math.max(0, Math.floor((now - start) / 1000));
      onChange(task.id, {
        timeSpentSeconds: (task.timeSpentSeconds ?? 0) + add,
        timerStartedAt: null,
      });
    } else {
      onChange(task.id, {timerStartedAt: new Date(now).toISOString()});
    }
  }

  return (
    <button
      aria-label={task.timerStartedAt ? t('timerStop') : t('timerStart')}
      className={`taskCard__iconBtn taskCard__iconBtn--timer ${task.timerStartedAt ? 'is-active' : ''}`}
      onClick={toggleTimer}
      title={task.timerStartedAt ? t('timerStop') : t('timerStart')}
      type="button"
    >
      <Timer aria-hidden size={16} />
      {trackedSeconds > 0 || task.timerStartedAt ? (
        <span aria-hidden className="taskCard__timerLabel">
          {formatDurationLabel(trackedSeconds)}
        </span>
      ) : null}
    </button>
  );
}
