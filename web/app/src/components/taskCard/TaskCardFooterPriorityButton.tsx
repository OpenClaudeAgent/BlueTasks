import {useTranslation} from 'react-i18next';
import {nextPriority} from '../../lib/taskCardFormat';
import type {TaskDraftUpdate} from '../../types';
import {TaskCardPriorityIcon} from './TaskCardPriorityIcon';

export type TaskCardFooterPriorityButtonProps = {
  taskId: string;
  priority: 'low' | 'normal' | 'high';
  onChange: (taskId: string, update: TaskDraftUpdate) => void;
};

export function TaskCardFooterPriorityButton({
  taskId,
  priority,
  onChange,
}: TaskCardFooterPriorityButtonProps) {
  const {t} = useTranslation();

  const priorityLabel =
    priority === 'low'
      ? t('priorityShort.low')
      : priority === 'high'
        ? t('priorityShort.high')
        : t('priorityShort.normal');

  return (
    <button
      className="taskCard__footerPriority"
      onClick={() => onChange(taskId, {priority: nextPriority(priority)})}
      title={t('footerCyclePriority')}
      type="button"
    >
      <TaskCardPriorityIcon priority={priority} />
      <span className="taskCard__footerMeta">{t('footerPriority')}</span>
      <span className={`taskCard__footerMeta taskCard__footerMeta--priority-${priority}`}>
        {priorityLabel}
      </span>
    </button>
  );
}
