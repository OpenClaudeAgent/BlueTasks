import {CalendarDays, LoaderCircle, Pin, Trash2, type LucideIcon} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import type {Area, RecurrenceKind, TaskDraftUpdate, TaskPriority} from '../../types';
import {TaskCardFooterAreaPicker} from './TaskCardFooterAreaPicker';
import {TaskCardFooterEstimatePicker} from './TaskCardFooterEstimatePicker';
import {TaskCardFooterPriorityButton} from './TaskCardFooterPriorityButton';
import {TaskCardFooterRecurrencePicker} from './TaskCardFooterRecurrencePicker';
import {TaskCardFooterTimerButton} from './TaskCardFooterTimerButton';

export type TaskCardFooterProps = {
  taskId: string;
  taskTitle: string;
  taskDate: string | null;
  estimateMinutes: number | null;
  areaId: string | null;
  priority: TaskPriority;
  pinned: boolean;
  recurrence: RecurrenceKind | null;
  timerStartedAt: string | null;
  timeSpentSeconds: number;
  checklistTotal: number;
  areaGlyph: LucideIcon;
  areas: Area[];
  isSaving: boolean;
  trackedSeconds: number;
  checklistRatio: number;
  onChange: (taskId: string, update: TaskDraftUpdate) => void;
  onDelete: (taskId: string) => void;
  onOpenHeaderDatePopover: () => void;
};

export function TaskCardFooter({
  taskId,
  taskTitle,
  taskDate,
  estimateMinutes,
  areaId,
  priority,
  pinned,
  recurrence,
  timerStartedAt,
  timeSpentSeconds,
  checklistTotal,
  areaGlyph,
  areas,
  isSaving,
  trackedSeconds,
  checklistRatio,
  onChange,
  onDelete,
  onOpenHeaderDatePopover,
}: TaskCardFooterProps) {
  const {t} = useTranslation();

  return (
    <footer className="taskCard__footerBar">
      <div className="taskCard__footerLeft">
        {!taskDate ? <span className="taskCard__footerMeta">{t('later')}</span> : null}

        <TaskCardFooterEstimatePicker estimateMinutes={estimateMinutes} onChange={onChange} taskId={taskId} />

        <TaskCardFooterAreaPicker
          areaGlyph={areaGlyph}
          areaId={areaId}
          areas={areas}
          onChange={onChange}
          taskId={taskId}
        />

        <TaskCardFooterPriorityButton onChange={onChange} priority={priority} taskId={taskId} />

        <span className="taskCard__footerMeta">
          {checklistTotal ? t('footerSubtasksPercent', {percent: checklistRatio}) : t('footerNoSubtasks')}
        </span>

        <span className={`taskCard__saveState ${isSaving ? 'is-saving' : ''}`}>
          {isSaving ? <LoaderCircle className="is-spinning" size={12} /> : null}
          {isSaving ? t('saving') : t('allChangesSaved')}
        </span>
      </div>

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
    </footer>
  );
}
