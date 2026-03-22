import {LoaderCircle, type LucideIcon} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import type {Category, RecurrenceKind, TaskDraftUpdate, TaskPriority} from '../../types';
import {TaskCardFooterCategoryPicker} from './TaskCardFooterCategoryPicker';
import {TaskCardFooterEstimatePicker} from './TaskCardFooterEstimatePicker';
import {TaskCardFooterPriorityButton} from './TaskCardFooterPriorityButton';
import {TaskCardFooterRight} from './TaskCardFooterRight';

export type TaskCardFooterProps = {
  taskId: string;
  taskTitle: string;
  taskDate: string | null;
  estimateMinutes: number | null;
  categoryId: string | null;
  priority: TaskPriority;
  pinned: boolean;
  recurrence: RecurrenceKind | null;
  timerStartedAt: string | null;
  timeSpentSeconds: number;
  checklistTotal: number;
  categoryGlyph: LucideIcon;
  categories: Category[];
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
  categoryId,
  priority,
  pinned,
  recurrence,
  timerStartedAt,
  timeSpentSeconds,
  checklistTotal,
  categoryGlyph,
  categories,
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
        <TaskCardFooterEstimatePicker
          estimateMinutes={estimateMinutes}
          onChange={onChange}
          taskId={taskId}
        />

        <TaskCardFooterCategoryPicker
          categories={categories}
          categoryGlyph={categoryGlyph}
          categoryId={categoryId}
          onChange={onChange}
          taskId={taskId}
        />

        <TaskCardFooterPriorityButton onChange={onChange} priority={priority} taskId={taskId} />

        <span className="taskCard__footerMeta">
          {checklistTotal
            ? t('footerSubtasksPercent', {percent: checklistRatio})
            : t('footerNoSubtasks')}
        </span>

        <span className={`taskCard__saveState ${isSaving ? 'is-saving' : ''}`}>
          {isSaving ? <LoaderCircle className="is-spinning" size={12} /> : null}
          {isSaving ? t('saving') : t('allChangesSaved')}
        </span>
      </div>

      <TaskCardFooterRight
        onChange={onChange}
        onDelete={onDelete}
        onOpenHeaderDatePopover={onOpenHeaderDatePopover}
        pinned={pinned}
        recurrence={recurrence}
        taskDate={taskDate}
        taskId={taskId}
        taskTitle={taskTitle}
        timeSpentSeconds={timeSpentSeconds}
        timerStartedAt={timerStartedAt}
        trackedSeconds={trackedSeconds}
      />
    </footer>
  );
}
