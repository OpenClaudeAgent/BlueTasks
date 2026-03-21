import {CalendarDays, LoaderCircle, Pin, Trash2} from 'lucide-react';
import {useMemo} from 'react';
import {useTranslation} from 'react-i18next';
import {getAreaIconComponent} from '../../lib/areaIcons';
import {coercePinned, coerceRecurrence} from '../../lib/taskPropertyValidation';
import type {Area, Task, TaskDraftUpdate} from '../../types';
import {TaskCardFooterAreaPicker} from './TaskCardFooterAreaPicker';
import {TaskCardFooterEstimatePicker} from './TaskCardFooterEstimatePicker';
import {TaskCardFooterPriorityButton} from './TaskCardFooterPriorityButton';
import {TaskCardFooterRecurrencePicker} from './TaskCardFooterRecurrencePicker';
import {TaskCardFooterTimerButton} from './TaskCardFooterTimerButton';

export type TaskCardFooterProps = {
  task: Task;
  areas: Area[];
  isSaving: boolean;
  trackedSeconds: number;
  checklistRatio: number;
  onChange: (taskId: string, update: TaskDraftUpdate) => void;
  onDelete: (taskId: string) => void;
  onOpenHeaderDatePopover: () => void;
};

export function TaskCardFooter({
  task,
  areas,
  isSaving,
  trackedSeconds,
  checklistRatio,
  onChange,
  onDelete,
  onOpenHeaderDatePopover,
}: TaskCardFooterProps) {
  const {t} = useTranslation();

  const priority = task.priority ?? 'normal';
  const pinned = coercePinned(task.pinned);
  const recurrence = coerceRecurrence(task.recurrence);

  const AreaGlyph = useMemo(
    () => getAreaIconComponent(task.areaId ? areas.find((a) => a.id === task.areaId)?.icon : undefined),
    [areas, task.areaId],
  );

  return (
    <footer className="taskCard__footerBar">
      <div className="taskCard__footerLeft">
        {!task.taskDate ? <span className="taskCard__footerMeta">{t('later')}</span> : null}

        <TaskCardFooterEstimatePicker estimateMinutes={task.estimateMinutes} onChange={onChange} taskId={task.id} />

        <TaskCardFooterAreaPicker
          areaGlyph={AreaGlyph}
          areaId={task.areaId}
          areas={areas}
          onChange={onChange}
          taskId={task.id}
        />

        <TaskCardFooterPriorityButton onChange={onChange} priority={priority} taskId={task.id} />

        <span className="taskCard__footerMeta">
          {task.checklistTotal ? t('footerSubtasksPercent', {percent: checklistRatio}) : t('footerNoSubtasks')}
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
            onChange(task.id, {pinned: !pinned});
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
        <TaskCardFooterRecurrencePicker onChange={onChange} recurrence={recurrence} taskDate={task.taskDate} taskId={task.id} />
        <TaskCardFooterTimerButton onChange={onChange} task={task} trackedSeconds={trackedSeconds} />
        <button
          className="taskCard__iconBtn taskCard__iconBtn--danger"
          onClick={(event) => {
            event.stopPropagation();
            if (window.confirm(t('deleteTaskConfirm', {title: task.title || t('untitledTask')}))) {
              onDelete(task.id);
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
