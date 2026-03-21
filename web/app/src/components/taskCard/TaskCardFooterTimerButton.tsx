import {useRef, type MouseEvent} from 'react';
import {Timer} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {formatDurationLabel} from '../../lib/taskCardFormat';
import type {TaskDraftUpdate} from '../../types';

export type TaskCardFooterTimerButtonProps = {
  taskId: string;
  timerStartedAt: string | null;
  timeSpentSeconds: number;
  trackedSeconds: number;
  onChange: (taskId: string, update: TaskDraftUpdate) => void;
};

export function TaskCardFooterTimerButton({
  taskId,
  timerStartedAt,
  timeSpentSeconds,
  trackedSeconds,
  onChange,
}: TaskCardFooterTimerButtonProps) {
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

    if (timerStartedAt) {
      const start = Date.parse(timerStartedAt);
      const add = Number.isNaN(start) ? 0 : Math.max(0, Math.floor((now - start) / 1000));
      onChange(taskId, {
        timeSpentSeconds: (timeSpentSeconds ?? 0) + add,
        timerStartedAt: null,
      });
    } else {
      onChange(taskId, {timerStartedAt: new Date(now).toISOString()});
    }
  }

  return (
    <button
      aria-label={timerStartedAt ? t('timerStop') : t('timerStart')}
      className={`taskCard__iconBtn taskCard__iconBtn--timer ${timerStartedAt ? 'is-active' : ''}`}
      onClick={toggleTimer}
      title={timerStartedAt ? t('timerStop') : t('timerStart')}
      type="button"
    >
      <Timer aria-hidden size={16} />
      {trackedSeconds > 0 || timerStartedAt ? (
        <span aria-hidden className="taskCard__timerLabel">
          {formatDurationLabel(trackedSeconds)}
        </span>
      ) : null}
    </button>
  );
}
