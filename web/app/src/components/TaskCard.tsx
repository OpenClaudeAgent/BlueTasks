import {memo, useCallback, useRef} from 'react';
import {useTranslation} from 'react-i18next';
import {TaskCardExpandedBody} from './taskCard/TaskCardExpandedBody';
import {TaskCardHeaderRow} from './taskCard/TaskCardHeaderRow';
import {useAutoFocusTaskTitle} from './taskCard/useAutoFocusTaskTitle';
import {taskCardPropsAreEqual, type TaskCardProps} from './taskCard/taskCardProps';
import {useTaskCardChrome} from './taskCard/useTaskCardChrome';

export type {TaskCardProps};

function TaskCardComponent({
  task,
  areas,
  boardChrome,
  expanded,
  autoFocusTitle = false,
  onAutoFocusTitleConsumed,
  isSaving,
  onToggleExpandTask,
  onChange,
  onDelete,
  onToggleStatus,
}: TaskCardProps) {
  const {i18n} = useTranslation();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const chrome = useTaskCardChrome(
    task,
    areas,
    i18n.language,
    isSaving,
    onChange,
    onDelete,
    boardChrome,
  );

  const handleToggleExpand = useCallback(() => {
    onToggleExpandTask(task.id);
  }, [onToggleExpandTask, task.id]);

  useAutoFocusTaskTitle({
    autoFocusTitle,
    expanded,
    onConsumed: onAutoFocusTitleConsumed,
    taskId: task.id,
    titleInputRef,
  });

  return (
    <article
      className={`taskCard ${expanded ? 'is-expanded' : ''} ${task.status === 'completed' ? 'is-completed' : ''}`}
    >
      <TaskCardHeaderRow
        AreaGlyph={chrome.AreaGlyph}
        areaDisplayName={chrome.areaDisplayName}
        dateOpen={chrome.dateOpen}
        datePillLabel={chrome.datePillLabel}
        dateTone={chrome.dateTone}
        dayPickerLocale={chrome.dayPickerLocale}
        expanded={expanded}
        onChange={onChange}
        onDateOpenChange={chrome.setDateOpen}
        onSelectDate={chrome.updateDate}
        onToggleExpand={handleToggleExpand}
        onToggleStatus={onToggleStatus}
        pinned={chrome.pinned}
        recurrence={chrome.recurrence}
        task={task}
        titleInputRef={titleInputRef}
        trackedSeconds={chrome.trackedSeconds}
      />

      {expanded ? <TaskCardExpandedBody footer={chrome.footerProps} task={task} /> : null}
    </article>
  );
}

export const TaskCard = memo(TaskCardComponent, taskCardPropsAreEqual);
