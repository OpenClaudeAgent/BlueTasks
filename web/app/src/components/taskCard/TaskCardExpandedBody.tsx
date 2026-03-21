import {lazy, Suspense} from 'react';
import {useTranslation} from 'react-i18next';
import {createEmptyEditorState, lexicalDocsContentEqual} from '../../lib/editorState';
import type {Task} from '../../types';
import {buildLexicalEditorLabels} from './lexicalEditorLabels';
import {TaskCardFooter, type TaskCardFooterProps} from './TaskCardFooter';

const LazyLexicalTaskEditor = lazy(async () => {
  const module = await import('../LexicalTaskEditor');
  return {default: module.LexicalTaskEditor};
});

export type TaskCardExpandedBodyProps = {
  task: Task;
  footer: TaskCardFooterProps;
};

export function TaskCardExpandedBody({task, footer}: TaskCardExpandedBodyProps) {
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
            footer.onChange(task.id, {
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
        <span style={{width: `${footer.checklistRatio}%`}} />
      </div>

      <TaskCardFooter {...footer} />
    </div>
  );
}
