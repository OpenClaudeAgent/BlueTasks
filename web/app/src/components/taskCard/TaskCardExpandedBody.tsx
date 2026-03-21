import {lazy, Suspense} from 'react';
import {useTranslation} from 'react-i18next';
import {createEmptyEditorState, lexicalDocsContentEqual} from '../../lib/editorState';
import type {Area, Task, TaskDraftUpdate} from '../../types';
import {buildLexicalEditorLabels} from './lexicalEditorLabels';
import {TaskCardFooter} from './TaskCardFooter';

const LazyLexicalTaskEditor = lazy(async () => {
  const module = await import('../LexicalTaskEditor');
  return {default: module.LexicalTaskEditor};
});

export type TaskCardExpandedBodyProps = {
  task: Task;
  areas: Area[];
  isSaving: boolean;
  checklistRatio: number;
  trackedSeconds: number;
  onChange: (taskId: string, update: TaskDraftUpdate) => void;
  onDelete: (taskId: string) => void;
  onOpenHeaderDatePopover: () => void;
};

export function TaskCardExpandedBody({
  task,
  areas,
  isSaving,
  checklistRatio,
  trackedSeconds,
  onChange,
  onDelete,
  onOpenHeaderDatePopover,
}: TaskCardExpandedBodyProps) {
  const {t} = useTranslation();

  return (
    <div className="taskCard__body">
      <Suspense fallback={<div className="editorLoading">{t('editorLoading')}</div>}>
        <LazyLexicalTaskEditor
          key={task.id}
          value={task.contentJson?.trim() || createEmptyEditorState()}
          labels={buildLexicalEditorLabels(t)}
          onChange={(payload) => {
            const currentJson = task.contentJson?.trim() || createEmptyEditorState();
            if (
              lexicalDocsContentEqual(payload.json, currentJson) &&
              payload.checklistTotal === task.checklistTotal &&
              payload.checklistCompleted === task.checklistCompleted
            ) {
              return;
            }
            onChange(task.id, {
              contentJson: payload.json,
              contentText: payload.plainText,
              checklistTotal: payload.checklistTotal,
              checklistCompleted: payload.checklistCompleted,
            });
          }}
          placeholder={t('editorPlaceholder')}
        />
      </Suspense>

      <div className="taskCard__progressTrack" aria-hidden="true">
        <span style={{width: `${checklistRatio}%`}} />
      </div>

      <TaskCardFooter
        areas={areas}
        checklistRatio={checklistRatio}
        isSaving={isSaving}
        onChange={onChange}
        onDelete={onDelete}
        onOpenHeaderDatePopover={onOpenHeaderDatePopover}
        task={task}
        trackedSeconds={trackedSeconds}
      />
    </div>
  );
}
