/** @vitest-environment jsdom */
/**
 * Behaviour-focused tests: what a user sees and does on a task card, not implementation details.
 * Wording follows Feature → Scenario → outcome (BDD-style).
 */
import {useMemo, useState, type ComponentProps} from 'react';
import {describe, expect, it, vi, beforeEach} from 'vitest';
import {render, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {I18nextProvider} from 'react-i18next';
import i18n from '../i18n';
import {createTask} from '../lib/tasks';
import {todayKey} from '../lib/dateKeys';
import type {Area, Task, TaskDraftUpdate} from '../types';
import {TaskCard} from './TaskCard';

vi.mock('./LexicalTaskEditor', () => ({
  LexicalTaskEditor: ({
    onChange,
  }: {
    onChange?: (payload: {
      json: string;
      plainText: string;
      checklistTotal: number;
      checklistCompleted: number;
    }) => void;
  }) => (
    <div data-testid="lexical-editor-mock">
      <button
        type="button"
        data-testid="lexical-simulate-edit"
        onClick={() =>
          onChange?.({
            json: '{"root":{"children":[{"children":[],"direction":null,"format":"","indent":0,"type":"paragraph","version":1}],"direction":null,"format":"","indent":0,"type":"root","version":1}}',
            plainText: '',
            checklistTotal: 0,
            checklistCompleted: 0,
          })
        }
      />
    </div>
  ),
}));

const sampleAreas: Area[] = [
  {id: 'a1', name: 'Work', icon: 'folder', sortIndex: 0, createdAt: '2025-01-01T00:00:00.000Z'},
];

function TaskCardHarness(props: Omit<ComponentProps<typeof TaskCard>, 'boardChrome'>) {
  const [datePopoverTaskId, setDatePopoverTaskId] = useState<string | null>(null);
  const boardChrome = useMemo(
    () => ({
      datePopoverTaskId,
      setDatePopoverTaskId,
      liveTimerNowMs: 0,
    }),
    [datePopoverTaskId],
  );
  return <TaskCard {...props} boardChrome={boardChrome} />;
}

function ExpandedTaskLive({
  initial,
  onChangeSpy,
  ...rest
}: {
  initial: Task;
  onChangeSpy?: (taskId: string, update: TaskDraftUpdate) => void;
} & Omit<ComponentProps<typeof TaskCardHarness>, 'task' | 'onChange' | 'expanded'>) {
  const [task, setTask] = useState(initial);
  return (
    <TaskCardHarness
      {...rest}
      expanded
      task={task}
      onChange={(taskId, update) => {
        onChangeSpy?.(taskId, update);
        setTask((t) => (t.id === taskId ? {...t, ...update} : t));
      }}
    />
  );
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('Feature: Task importance in the list', () => {
  describe('Scenario: Someone glances at the row and understands urgency', () => {
    it('given three tasks with different importance, when the list is shown, then each row exposes Low, Normal, or High', () => {
      const high = {...createTask('Urgent'), priority: 'high' as const};
      const normal = {...createTask('Standard'), priority: 'normal' as const};
      const low = {...createTask('Whenever'), priority: 'low' as const};

      render(
        <I18nextProvider i18n={i18n}>
          <div>
            <TaskCardHarness
              areas={[]}
              expanded={false}
              isSaving={false}
              onChange={vi.fn()}
              onDelete={vi.fn()}
              onToggleExpandTask={vi.fn()}
              onToggleStatus={vi.fn()}
              task={high}
            />
            <TaskCardHarness
              areas={[]}
              expanded={false}
              isSaving={false}
              onChange={vi.fn()}
              onDelete={vi.fn()}
              onToggleExpandTask={vi.fn()}
              onToggleStatus={vi.fn()}
              task={normal}
            />
            <TaskCardHarness
              areas={[]}
              expanded={false}
              isSaving={false}
              onChange={vi.fn()}
              onDelete={vi.fn()}
              onToggleExpandTask={vi.fn()}
              onToggleStatus={vi.fn()}
              task={low}
            />
          </div>
        </I18nextProvider>,
      );

      const articles = screen.getAllByRole('article');
      expect(articles).toHaveLength(3);
      expect(within(articles[0]!).getByRole('img', {name: /^high$/i})).toBeInTheDocument();
      expect(within(articles[1]!).getByRole('img', {name: /^normal$/i})).toBeInTheDocument();
      expect(within(articles[2]!).getByRole('img', {name: /^low$/i})).toBeInTheDocument();
    });
  });

  describe('Scenario: User bumps priority up from the card footer', () => {
    it('given an open card at normal importance, when they use the priority control, then the task moves to the next step (high)', async () => {
      const user = userEvent.setup();
      const onChangeSpy = vi.fn();
      const initial = {...createTask('Refine scope'), priority: 'normal' as const};

      render(
        <I18nextProvider i18n={i18n}>
          <ExpandedTaskLive
            areas={sampleAreas}
            initial={initial}
            isSaving={false}
            onChangeSpy={onChangeSpy}
            onDelete={vi.fn()}
            onToggleExpandTask={vi.fn()}
            onToggleStatus={vi.fn()}
          />
        </I18nextProvider>,
      );

      const card = screen.getByRole('article');
      const footer = within(card).getByRole('contentinfo');
      await user.click(within(footer).getByTitle(/change priority/i));

      expect(onChangeSpy).toHaveBeenCalledWith(initial.id, {priority: 'high'});
    });
  });
});

describe('Feature: Checklist progress when the task is open', () => {
  describe('Scenario: User sees how far along subtasks are', () => {
    it('given an expanded task with checklist items, when the footer is visible, then the completion share is shown in plain language', () => {
      const task = {...createTask('Release checklist'), checklistTotal: 4, checklistCompleted: 2};

      render(
        <I18nextProvider i18n={i18n}>
          <TaskCardHarness
            areas={sampleAreas}
            expanded
            isSaving={false}
            onChange={vi.fn()}
            onDelete={vi.fn()}
            onToggleExpandTask={vi.fn()}
            onToggleStatus={vi.fn()}
            task={task}
          />
        </I18nextProvider>,
      );

      const card = screen.getByRole('article');
      const footer = within(card).getByRole('contentinfo');
      expect(within(footer).getByText('50% of subtasks')).toBeVisible();
    });
  });

  describe('Scenario: No checklist rows yet', () => {
    it('given an expanded task with zero checklist items, when the footer is visible, then the footer shows the no-subtasks baseline', () => {
      const task = {...createTask('Rough idea'), checklistTotal: 0, checklistCompleted: 0};

      render(
        <I18nextProvider i18n={i18n}>
          <TaskCardHarness
            areas={[]}
            expanded
            isSaving={false}
            onChange={vi.fn()}
            onDelete={vi.fn()}
            onToggleExpandTask={vi.fn()}
            onToggleStatus={vi.fn()}
            task={task}
          />
        </I18nextProvider>,
      );

      const card = screen.getByRole('article');
      const footer = within(card).getByRole('contentinfo');
      expect(within(footer).getByText('0% of subtasks')).toBeVisible();
    });
  });
});

describe('Feature: Task context on the row (collapsed)', () => {
  describe('Scenario: Pinned work stays visually marked', () => {
    it('given a pinned task, when it appears in the list, then the pin marker is available to assistive tech', () => {
      const task = {...createTask('Board deck'), pinned: true};

      render(
        <I18nextProvider i18n={i18n}>
          <TaskCardHarness
            areas={[]}
            expanded={false}
            isSaving={false}
            onChange={vi.fn()}
            onDelete={vi.fn()}
            onToggleExpandTask={vi.fn()}
            onToggleStatus={vi.fn()}
            task={task}
          />
        </I18nextProvider>,
      );

      const card = screen.getByRole('article');
      expect(within(card).getByRole('img', {name: /pin to top/i})).toBeInTheDocument();
    });
  });

  describe('Scenario: User sees which project a task belongs to', () => {
    it('given a task linked to an area, when the row renders, then the area name appears beside the title', () => {
      const task = {...createTask('Spec API'), areaId: 'a1'};

      render(
        <I18nextProvider i18n={i18n}>
          <TaskCardHarness
            areas={sampleAreas}
            expanded={false}
            isSaving={false}
            onChange={vi.fn()}
            onDelete={vi.fn()}
            onToggleExpandTask={vi.fn()}
            onToggleStatus={vi.fn()}
            task={task}
          />
        </I18nextProvider>,
      );

      const card = screen.getByRole('article');
      expect(within(card).getByText('Work')).toBeVisible();
    });
  });

  describe('Scenario: Repeating tasks show their rhythm', () => {
    it('given a daily recurring task with a due date, when the row renders, then Daily is visible on the chip', () => {
      const task = {
        ...createTask('Stand-up prep'),
        taskDate: todayKey(),
        recurrence: 'daily' as const,
      };

      render(
        <I18nextProvider i18n={i18n}>
          <TaskCardHarness
            areas={[]}
            expanded={false}
            isSaving={false}
            onChange={vi.fn()}
            onDelete={vi.fn()}
            onToggleExpandTask={vi.fn()}
            onToggleStatus={vi.fn()}
            task={task}
          />
        </I18nextProvider>,
      );

      const card = screen.getByRole('article');
      expect(within(card).getByText('Daily')).toBeVisible();
    });
  });

  describe('Scenario: A running timer is obvious in the header', () => {
    it('given a task with an active timer, when the row renders, then the timer chip is present', () => {
      const task = {
        ...createTask('Deep work'),
        timerStartedAt: new Date().toISOString(),
        timeSpentSeconds: 42,
      };

      render(
        <I18nextProvider i18n={i18n}>
          <TaskCardHarness
            areas={[]}
            expanded={false}
            isSaving={false}
            onChange={vi.fn()}
            onDelete={vi.fn()}
            onToggleExpandTask={vi.fn()}
            onToggleStatus={vi.fn()}
            task={task}
          />
        </I18nextProvider>,
      );

      const card = screen.getByRole('article');
      expect(within(card).getByTitle(/timer running/i)).toBeInTheDocument();
    });
  });
});
