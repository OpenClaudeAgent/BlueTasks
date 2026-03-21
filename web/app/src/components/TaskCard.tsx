import {useRef} from 'react';
import {useTranslation} from 'react-i18next';
import type {Area, Task, TaskDraftUpdate} from '../types';
import {TaskCardExpandedBody} from './taskCard/TaskCardExpandedBody';
import {TaskCardHeaderRow} from './taskCard/TaskCardHeaderRow';
import {useAutoFocusTaskTitle} from './taskCard/useAutoFocusTaskTitle';
import type {TaskCardBoardChrome} from './taskCard/useTaskCardChrome';
import {useTaskCardChrome} from './taskCard/useTaskCardChrome';

type TaskCardProps = {
  task: Task;
  areas: Area[];
  boardChrome: TaskCardBoardChrome;
  expanded: boolean;
  /** First expanded render: focus the title field (e.g. after Add). */
  autoFocusTitle?: boolean;
  onAutoFocusTitleConsumed?: () => void;
  isSaving: boolean;
  onToggleExpand: () => void;
  onChange: (taskId: string, update: TaskDraftUpdate) => void;
  onDelete: (taskId: string) => void;
  onToggleStatus: (taskId: string) => void;
};

export function TaskCard({
  task,
  areas,
  boardChrome,
  expanded,
  autoFocusTitle = false,
  onAutoFocusTitleConsumed,
  isSaving,
  onToggleExpand,
  onChange,
  onDelete,
  onToggleStatus,
}: TaskCardProps) {
  const {i18n} = useTranslation();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const chrome = useTaskCardChrome(task, areas, i18n.language, isSaving, onChange, onDelete, boardChrome);

  useAutoFocusTaskTitle({
    autoFocusTitle,
    expanded,
    onConsumed: onAutoFocusTitleConsumed,
    taskId: task.id,
    titleInputRef,
  });

  return (
    <article className={`taskCard ${expanded ? 'is-expanded' : ''} ${task.status === 'completed' ? 'is-completed' : ''}`}>
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
        onToggleExpand={onToggleExpand}
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
