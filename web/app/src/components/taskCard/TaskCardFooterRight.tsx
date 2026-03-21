import {CalendarDays, Pin, Trash2} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import type {RecurrenceKind, TaskDraftUpdate} from '../../types';
import {TaskCardFooterRecurrencePicker} from './TaskCardFooterRecurrencePicker';
import {TaskCardFooterTimerButton} from './TaskCardFooterTimerButton';

export type TaskCardFooterRightProps = {
  taskId: string;
  taskTitle: string;
  taskDate: string | null;
  pinned: boolean;
  recurrence: RecurrenceKind | null;
  timerStartedAt: string | null;
  timeSpentSeconds: number;
  trackedSeconds: number;
  onChange: (taskId: string, update: TaskDraftUpdate) => void;
  onDelete: (taskId: string) => void;
  onOpenHeaderDatePopover: () => void;
};

export function TaskCardFooterRight({
  taskId,
  taskTitle,
  taskDate,
  pinned,
  recurrence,
  timerStartedAt,
  timeSpentSeconds,
  trackedSeconds,
  onChange,
  onDelete,
  onOpenHeaderDatePopover,
}: TaskCardFooterRightProps) {
  const {t} = useTranslation();

  return (
    <div className="taskCard__footerRight">
      <button
        className={`taskCard__iconBtn ${pinned ? 'is-active' : ''}`}
        onClick={(event) => {
          event.stopPropagation();
          onChange(taskId, {pinned: !pinned});
        }}
        title={pinned ? t('unpin') : t('pin')}
        type="button"
      >
        <Pin size={16} />
      </button>
      <button
        className="taskCard__iconBtn"
        onClick={(event) => {
          event.stopPropagation();
          onOpenHeaderDatePopover();
        }}
        title={t('dueDate')}
        type="button"
      >
        <CalendarDays size={16} />
      </button>
      <TaskCardFooterRecurrencePicker
        onChange={onChange}
        recurrence={recurrence}
        taskDate={taskDate}
        taskId={taskId}
      />
      <TaskCardFooterTimerButton
        onChange={onChange}
        taskId={taskId}
        timeSpentSeconds={timeSpentSeconds}
        timerStartedAt={timerStartedAt}
        trackedSeconds={trackedSeconds}
      />
      <button
        className="taskCard__iconBtn taskCard__iconBtn--danger"
        onClick={(event) => {
          event.stopPropagation();
          if (window.confirm(t('deleteTaskConfirm', {title: taskTitle || t('untitledTask')}))) {
            onDelete(taskId);
          }
        }}
        title={t('delete')}
        type="button"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
