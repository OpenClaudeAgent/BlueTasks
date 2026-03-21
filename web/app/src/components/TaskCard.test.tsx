/** @vitest-environment jsdom */
import {describe, expect, it, vi} from 'vitest';
import {render, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {I18nextProvider} from 'react-i18next';
import i18n from '../i18n';
import {createTask} from '../lib/tasks';
import {TaskCard} from './TaskCard';

vi.mock('./LexicalTaskEditor', () => ({
  LexicalTaskEditor: () => <div data-testid="lexical-editor-mock" />,
}));

describe('Feature: Task card (collapsed)', () => {
  describe('Scenario: User sees a task in the list', () => {
    it('given a pending task with a title, when the card is collapsed, then the title is visible', () => {
      const task = createTask('Buy milk');
      const {container} = render(
        <I18nextProvider i18n={i18n}>
          <TaskCard
            areas={[]}
            expanded={false}
            isSaving={false}
            onChange={vi.fn()}
            onDelete={vi.fn()}
            onToggleExpand={vi.fn()}
            onToggleStatus={vi.fn()}
            task={task}
          />
        </I18nextProvider>,
      );

      const card = container.querySelector('article.taskCard');
      expect(card).not.toBeNull();
      expect(card!.tagName).toBe('ARTICLE');
      expect(card).toHaveClass('taskCard');
      expect(card).not.toHaveClass('is-expanded');
      expect(within(card!).getByRole('button', {name: /buy milk/i})).toBeInTheDocument();
    });
  });

  describe('Scenario: User expands the card', () => {
    it('given a collapsed card, when they click the chevron, then onToggleExpand is called', async () => {
      const user = userEvent.setup();
      const onToggleExpand = vi.fn();
      const task = createTask('Review');

      const {container} = render(
        <I18nextProvider i18n={i18n}>
          <TaskCard
            areas={[]}
            expanded={false}
            isSaving={false}
            onChange={vi.fn()}
            onDelete={vi.fn()}
            onToggleExpand={onToggleExpand}
            onToggleStatus={vi.fn()}
            task={task}
          />
        </I18nextProvider>,
      );

      const card = container.querySelector('article.taskCard');
      expect(card).not.toBeNull();
      expect(card!.tagName).toBe('ARTICLE');
      expect(card).toHaveClass('taskCard');
      await user.click(within(card!).getByRole('button', {name: /expand task/i}));
      expect(onToggleExpand).toHaveBeenCalledTimes(1);
    });
  });

  describe('Scenario: User marks a task done from the row', () => {
    it('given a pending task, when they activate the status control, then onToggleStatus receives the task id', async () => {
      const user = userEvent.setup();
      const onToggleStatus = vi.fn();
      const task = createTask('Ship feature');

      const {container} = render(
        <I18nextProvider i18n={i18n}>
          <TaskCard
            areas={[]}
            expanded={false}
            isSaving={false}
            onChange={vi.fn()}
            onDelete={vi.fn()}
            onToggleExpand={vi.fn()}
            onToggleStatus={onToggleStatus}
            task={task}
          />
        </I18nextProvider>,
      );

      const card = container.querySelector('article.taskCard');
      expect(card).not.toBeNull();
      expect(card!.tagName).toBe('ARTICLE');
      expect(card).toHaveClass('taskCard');
      await user.click(within(card!).getByRole('button', {name: /mark as done/i}));
      expect(onToggleStatus).toHaveBeenCalledWith(task.id);
    });
  });
});

describe('Feature: Task card (expanded)', () => {
  describe('Scenario: Editor loads', () => {
    it('given expanded true, when rendered, then the lazy editor placeholder is shown', async () => {
      const task = createTask('Draft');

      const {container} = render(
        <I18nextProvider i18n={i18n}>
          <TaskCard
            areas={[]}
            expanded
            isSaving={false}
            onChange={vi.fn()}
            onDelete={vi.fn()}
            onToggleExpand={vi.fn()}
            onToggleStatus={vi.fn()}
            task={task}
          />
        </I18nextProvider>,
      );

      const card = container.querySelector('article.taskCard');
      expect(card).not.toBeNull();
      expect(card!.tagName).toBe('ARTICLE');
      expect(card).toHaveClass('taskCard', 'is-expanded');
      expect(await within(card!).findByTestId('lexical-editor-mock')).toBeInTheDocument();
    });
  });
});
