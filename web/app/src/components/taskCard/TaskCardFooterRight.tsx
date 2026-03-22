import * as AlertDialog from '@radix-ui/react-alert-dialog';
import {CalendarDays, Pin, Trash2} from 'lucide-react';
import {useState} from 'react';
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
  const [deleteOpen, setDeleteOpen] = useState(false);

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
      <AlertDialog.Root onOpenChange={setDeleteOpen} open={deleteOpen}>
        <AlertDialog.Trigger asChild>
          <button
            aria-label={t('delete')}
            className="taskCard__iconBtn taskCard__iconBtn--danger"
            onClick={(event) => event.stopPropagation()}
            title={t('delete')}
            type="button"
          >
            <Trash2 size={16} />
          </button>
        </AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="confirmDialog__overlay" />
          <AlertDialog.Content
            className="confirmDialog__content"
            onClick={(event) => event.stopPropagation()}
          >
            <AlertDialog.Title className="confirmDialog__title">
              {t('deleteTaskDialogTitle')}
            </AlertDialog.Title>
            <AlertDialog.Description className="confirmDialog__description">
              {t('deleteTaskConfirm', {title: taskTitle || t('untitledTask')})}
            </AlertDialog.Description>
            <div className="confirmDialog__actions">
              <AlertDialog.Cancel asChild>
                <button className="confirmDialog__btn confirmDialog__btn--secondary" type="button">
                  {t('cancel')}
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  className="confirmDialog__btn confirmDialog__btn--danger"
                  onClick={() => onDelete(taskId)}
                  type="button"
                >
                  {t('delete')}
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
