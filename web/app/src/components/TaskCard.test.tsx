/** @vitest-environment jsdom */
import {describe, expect, it, vi, beforeEach} from 'vitest';
import {useMemo, useState, type ComponentProps} from 'react';
import type {Task, TaskDraftUpdate} from '../types';
import {render, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {I18nextProvider} from 'react-i18next';
import i18n from '../i18n';
import {addDaysToKey, todayKey} from '../lib/dateKeys';
import {formatTaskDatePill} from '../lib/dateFormat';
import {createTask} from '../lib/tasks';
import type {Area} from '../types';
import {TaskCard} from './TaskCard';
import {taskCardPropsAreEqual, type TaskCardProps} from './taskCard/taskCardProps';

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
    value?: string;
  }) => (
    <div data-testid="lexical-editor-mock">
      <button
        type="button"
        data-testid="lexical-simulate-edit"
        onClick={() =>
          onChange?.({
            json: '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Simulated","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1}],"direction":null,"format":"","indent":0,"type":"root","version":1}}',
            plainText: 'Simulated notes body',
            checklistTotal: 2,
            checklistCompleted: 1,
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

/** Keeps task state in sync with `onChange` so controlled title blur and timer toggles behave like the app. */
function ExpandedTaskCardLive({
  initial,
  onChangeSpy,
  ...harnessRest
}: {
  initial: Task;
  onChangeSpy?: (taskId: string, update: TaskDraftUpdate) => void;
} & Omit<ComponentProps<typeof TaskCardHarness>, 'task' | 'onChange' | 'expanded'>) {
  const [task, setTask] = useState(initial);
  return (
    <TaskCardHarness
      {...harnessRest}
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

describe('Feature: Task card (collapsed)', () => {
  describe('Scenario: User sees a task in the list', () => {
    it('given a pending task with a title, when the card is collapsed, then the title is visible', () => {
      const task = createTask('Buy milk');
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
      expect(card).toHaveClass('taskCard');
      expect(card).not.toHaveClass('is-expanded');
      expect(within(card).getByRole('button', {name: /buy milk/i})).toBeInTheDocument();
    });
  });

  describe('Scenario: User expands the card', () => {
    it('given a collapsed card, when they click the chevron, then onToggleExpandTask is called with task id', async () => {
      const user = userEvent.setup();
      const onToggleExpandTask = vi.fn();
      const task = createTask('Review');

      render(
        <I18nextProvider i18n={i18n}>
          <TaskCardHarness
            areas={[]}
            expanded={false}
            isSaving={false}
            onChange={vi.fn()}
            onDelete={vi.fn()}
            onToggleExpandTask={onToggleExpandTask}
            onToggleStatus={vi.fn()}
            task={task}
          />
        </I18nextProvider>,
      );

      const card = screen.getByRole('article');
      expect(card).toHaveClass('taskCard');
      await user.click(within(card).getByRole('button', {name: /expand task/i}));
      expect(onToggleExpandTask).toHaveBeenCalledTimes(1);
      expect(onToggleExpandTask).toHaveBeenCalledWith(task.id);
    });
  });

  describe('Scenario: User marks a task done from the row', () => {
    it('given a pending task, when they activate the status control, then onToggleStatus receives the task id', async () => {
      const user = userEvent.setup();
      const onToggleStatus = vi.fn();
      const task = createTask('Ship feature');

      render(
        <I18nextProvider i18n={i18n}>
          <TaskCardHarness
            areas={[]}
            expanded={false}
            isSaving={false}
            onChange={vi.fn()}
            onDelete={vi.fn()}
            onToggleExpandTask={vi.fn()}
            onToggleStatus={onToggleStatus}
            task={task}
          />
        </I18nextProvider>,
      );

      const card = screen.getByRole('article');
      expect(card).toHaveClass('taskCard');
      await user.click(within(card).getByRole('button', {name: /mark as done/i}));
      expect(onToggleStatus).toHaveBeenCalledTimes(1);
      expect(onToggleStatus).toHaveBeenCalledWith(task.id);
    });
  });

  describe('Scenario: User reopens a completed task', () => {
    it('given a completed task, when they activate the status control, then onToggleStatus receives the task id', async () => {
      const user = userEvent.setup();
      const onToggleStatus = vi.fn();
      const task = {...createTask('Ship fix'), status: 'completed' as const};

      render(
        <I18nextProvider i18n={i18n}>
          <TaskCardHarness
            areas={[]}
            expanded={false}
            isSaving={false}
            onChange={vi.fn()}
            onDelete={vi.fn()}
            onToggleExpandTask={vi.fn()}
            onToggleStatus={onToggleStatus}
            task={task}
          />
        </I18nextProvider>,
      );

      const card = screen.getByRole('article');
      await user.click(within(card).getByRole('button', {name: /reopen task/i}));
      expect(onToggleStatus).toHaveBeenCalledTimes(1);
      expect(onToggleStatus).toHaveBeenCalledWith(task.id);
    });
  });
});

describe('Feature: Task card (expanded)', () => {
  describe('Scenario: Editor loads', () => {
    it('given expanded true, when rendered, then the lazy editor placeholder is shown', async () => {
      const task = createTask('Draft');

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
      expect(card).toHaveClass('taskCard', 'is-expanded');
      expect(await within(card).findByTestId('lexical-editor-mock')).toBeInTheDocument();
    });
  });

  describe('Scenario: User edits title and footer actions', () => {
    it('given expanded card, when title is edited and blurred, then onChange receives trimmed title', async () => {
      const user = userEvent.setup();
      const onChangeSpy = vi.fn();
      const initial = createTask('  Draft  ');
      render(
        <I18nextProvider i18n={i18n}>
          <ExpandedTaskCardLive
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
      const titleInput = within(card).getByRole('textbox', {name: /task title/i});
      await user.clear(titleInput);
      await user.type(titleInput, 'Final title');
      await user.tab();
      expect(onChangeSpy).toHaveBeenCalledWith(initial.id, {title: 'Final title'});
    });

    it('given expanded card, when user sets due date to Today from pill, then onChange updates taskDate', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const task = {...createTask('Dated'), taskDate: null};
      render(
        <I18nextProvider i18n={i18n}>
          <TaskCardHarness
            areas={sampleAreas}
            expanded
            isSaving={false}
            onChange={onChange}
            onDelete={vi.fn()}
            onToggleExpandTask={vi.fn()}
            onToggleStatus={vi.fn()}
            task={task}
          />
        </I18nextProvider>,
      );
      const card = screen.getByRole('article');
      await user.click(within(card).getByRole('button', {name: /—|no date/i}));
      await user.click(screen.getByRole('button', {name: /^today$/i}));
      expect(onChange).toHaveBeenCalledWith(task.id, {taskDate: todayKey(), recurrence: null});
    });

    it('given expanded card, when user sets due date to Tomorrow from pill, then onChange updates taskDate', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const task = {...createTask('Dated'), taskDate: null};
      render(
        <I18nextProvider i18n={i18n}>
          <TaskCardHarness
            areas={sampleAreas}
            expanded
            isSaving={false}
            onChange={onChange}
            onDelete={vi.fn()}
            onToggleExpandTask={vi.fn()}
            onToggleStatus={vi.fn()}
            task={task}
          />
        </I18nextProvider>,
      );
      const card = screen.getByRole('article');
      await user.click(within(card).getByRole('button', {name: /—|no date/i}));
      await user.click(screen.getByRole('button', {name: /^tomorrow$/i}));
      expect(onChange).toHaveBeenCalledWith(task.id, {
        taskDate: addDaysToKey(todayKey(), 1),
        recurrence: null,
      });
    });

    it('given expanded card, when user sets due date to In one week from pill, then onChange updates taskDate', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const task = {...createTask('Dated'), taskDate: null};
      render(
        <I18nextProvider i18n={i18n}>
          <TaskCardHarness
            areas={sampleAreas}
            expanded
            isSaving={false}
            onChange={onChange}
            onDelete={vi.fn()}
            onToggleExpandTask={vi.fn()}
            onToggleStatus={vi.fn()}
            task={task}
          />
        </I18nextProvider>,
      );
      const card = screen.getByRole('article');
      await user.click(within(card).getByRole('button', {name: /—|no date/i}));
      await user.click(screen.getByRole('button', {name: /^in one week$/i}));
      expect(onChange).toHaveBeenCalledWith(task.id, {
        taskDate: addDaysToKey(todayKey(), 7),
        recurrence: null,
      });
    });

    it('given expanded card with a due date, when user clears date from pill, then onChange clears taskDate', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const dateKey = todayKey();
      const task = {...createTask('Dated'), taskDate: dateKey};
      render(
        <I18nextProvider i18n={i18n}>
          <TaskCardHarness
            areas={sampleAreas}
            expanded
            isSaving={false}
            onChange={onChange}
            onDelete={vi.fn()}
            onToggleExpandTask={vi.fn()}
            onToggleStatus={vi.fn()}
            task={task}
          />
        </I18nextProvider>,
      );
      const card = screen.getByRole('article');
      const pillLabel = formatTaskDatePill(dateKey, 'en');
      await user.click(
        within(card).getByRole('button', {
          name: new RegExp(pillLabel.replace(/\s+/g, '\\s+'), 'i'),
        }),
      );
      await user.click(screen.getByRole('button', {name: /^clear$/i}));
      expect(onChange).toHaveBeenCalledWith(task.id, {taskDate: null, recurrence: null});
    });

    it('given expanded card, when user edits notes via editor, then onChange receives content and checklist fields', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const task = createTask('Notes task');
      render(
        <I18nextProvider i18n={i18n}>
          <TaskCardHarness
            areas={sampleAreas}
            expanded
            isSaving={false}
            onChange={onChange}
            onDelete={vi.fn()}
            onToggleExpandTask={vi.fn()}
            onToggleStatus={vi.fn()}
            task={task}
          />
        </I18nextProvider>,
      );
      const card = screen.getByRole('article');
      await user.click(within(card).getByTestId('lexical-simulate-edit'));
      expect(onChange).toHaveBeenCalledWith(
        task.id,
        expect.objectContaining({
          contentJson: expect.stringContaining('Simulated'),
          contentText: 'Simulated notes body',
          checklistTotal: 2,
          checklistCompleted: 1,
        }),
      );
    });

    it('given expanded card, when user toggles pin, then onChange updates pinned', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const task = {...createTask('Pin me'), pinned: false};
      render(
        <I18nextProvider i18n={i18n}>
          <TaskCardHarness
            areas={sampleAreas}
            expanded
            isSaving={false}
            onChange={onChange}
            onDelete={vi.fn()}
            onToggleExpandTask={vi.fn()}
            onToggleStatus={vi.fn()}
            task={task}
          />
        </I18nextProvider>,
      );
      const card = screen.getByRole('article');
      const footer = within(card).getByRole('contentinfo');
      const pinBtn = within(footer).getByTitle('Pin to top');
      await user.click(pinBtn);
      expect(onChange).toHaveBeenCalledWith(task.id, {pinned: true});
    });

    it('given expanded card, when user picks recurrence Daily, then onChange sets recurrence', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const task = {...createTask('Repeat'), taskDate: todayKey(), recurrence: null};
      render(
        <I18nextProvider i18n={i18n}>
          <TaskCardHarness
            areas={sampleAreas}
            expanded
            isSaving={false}
            onChange={onChange}
            onDelete={vi.fn()}
            onToggleExpandTask={vi.fn()}
            onToggleStatus={vi.fn()}
            task={task}
          />
        </I18nextProvider>,
      );
      const card = screen.getByRole('article');
      const footer = within(card).getByRole('contentinfo');
      await user.click(within(footer).getByTitle('Repeat'));
      await user.click(screen.getByRole('button', {name: /^daily$/i}));
      expect(onChange).toHaveBeenCalledWith(task.id, {recurrence: 'daily', taskDate: todayKey()});
    });

    it('given expanded card, when user starts and stops timer, then onChange updates timer fields', async () => {
      const user = userEvent.setup();
      const onChangeSpy = vi.fn();
      const initial = {...createTask('Time'), timerStartedAt: null, timeSpentSeconds: 0};
      render(
        <I18nextProvider i18n={i18n}>
          <ExpandedTaskCardLive
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
      await user.click(within(footer).getByRole('button', {name: /start timer/i}));
      expect(onChangeSpy.mock.calls.some((c) => c[1].timerStartedAt)).toBe(true);
      await new Promise((r) => setTimeout(r, 550));
      await user.click(within(footer).getByRole('button', {name: /stop timer/i}));
      expect(onChangeSpy).toHaveBeenCalledWith(
        initial.id,
        expect.objectContaining({timerStartedAt: null, timeSpentSeconds: expect.any(Number)}),
      );
    });

    it('given expanded card, when user saves edited tracked time, then onChange sets timeSpentSeconds and clears timer', async () => {
      const user = userEvent.setup();
      const onChangeSpy = vi.fn();
      const initial = {...createTask('Edit time'), timerStartedAt: null, timeSpentSeconds: 0};
      render(
        <I18nextProvider i18n={i18n}>
          <ExpandedTaskCardLive
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
      await user.click(within(footer).getByRole('button', {name: /edit tracked time/i}));
      const hours = screen.getByRole('textbox', {name: /^hours$/i});
      await user.clear(hours);
      await user.type(hours, '1');
      await user.click(screen.getByRole('button', {name: /^save$/i}));
      expect(onChangeSpy).toHaveBeenCalledWith(initial.id, {
        timeSpentSeconds: 3600,
        timerStartedAt: null,
      });
    });

    it('given expanded card, when user confirms delete, then onDelete is called', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      const task = createTask('Remove me');
      render(
        <I18nextProvider i18n={i18n}>
          <TaskCardHarness
            areas={sampleAreas}
            expanded
            isSaving={false}
            onChange={vi.fn()}
            onDelete={onDelete}
            onToggleExpandTask={vi.fn()}
            onToggleStatus={vi.fn()}
            task={task}
          />
        </I18nextProvider>,
      );
      const card = screen.getByRole('article');
      const footer = within(card).getByRole('contentinfo');
      await user.click(within(footer).getByRole('button', {name: 'Delete'}));
      const dialog = await screen.findByRole('alertdialog');
      await user.click(within(dialog).getByRole('button', {name: 'Delete'}));
      expect(onDelete).toHaveBeenCalledWith(task.id);
    });

    it('given expanded card, when user sets estimate, then onChange receives minutes', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const task = {...createTask('Estimate'), estimateMinutes: null};
      render(
        <I18nextProvider i18n={i18n}>
          <TaskCardHarness
            areas={sampleAreas}
            expanded
            isSaving={false}
            onChange={onChange}
            onDelete={vi.fn()}
            onToggleExpandTask={vi.fn()}
            onToggleStatus={vi.fn()}
            task={task}
          />
        </I18nextProvider>,
      );
      const card = screen.getByRole('article');
      await user.click(within(card).getByTitle('Time estimate'));
      await user.click(await screen.findByRole('button', {name: /30\s*min/i}));
      expect(onChange).toHaveBeenCalledWith(task.id, {estimateMinutes: 30});
    });

    it('given expanded card, when user assigns area Work, then onChange receives area id', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const task = {...createTask('Area'), areaId: null};
      render(
        <I18nextProvider i18n={i18n}>
          <TaskCardHarness
            areas={sampleAreas}
            expanded
            isSaving={false}
            onChange={onChange}
            onDelete={vi.fn()}
            onToggleExpandTask={vi.fn()}
            onToggleStatus={vi.fn()}
            task={task}
          />
        </I18nextProvider>,
      );
      const card = screen.getByRole('article');
      await user.click(within(card).getByTitle('Area'));
      await user.click(await screen.findByRole('button', {name: /^work$/i}));
      expect(onChange).toHaveBeenCalledWith(task.id, {areaId: 'a1'});
    });

    it('given recurring pending task, status control exposes recurrence completion label', () => {
      const task = {
        ...createTask('Recur'),
        recurrence: 'daily' as const,
        taskDate: todayKey(),
      };
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
      expect(within(card).getByRole('button', {name: /complete occurrence/i})).toBeInTheDocument();
    });
  });
});

describe('Feature: TaskCard memo comparator', () => {
  const noop = () => {};
  const baseTask = createTask('T');

  function baseProps(): TaskCardProps {
    return {
      task: baseTask,
      areas: [],
      boardChrome: {
        datePopoverTaskId: null,
        setDatePopoverTaskId: noop,
        liveTimerNowMs: 0,
      },
      expanded: false,
      isSaving: false,
      onToggleExpandTask: noop,
      onChange: noop,
      onDelete: noop,
      onToggleStatus: noop,
    };
  }

  it('given no active timer, when only liveTimerNowMs changes, then props are equal (skip re-render)', () => {
    const prev = baseProps();
    const next: TaskCardProps = {
      ...prev,
      boardChrome: {...prev.boardChrome, liveTimerNowMs: 99_999},
    };
    expect(taskCardPropsAreEqual(prev, next)).toBe(true);
  });

  it('given active timer, when liveTimerNowMs changes, then props are not equal', () => {
    const taskWithTimer = {
      ...baseTask,
      timerStartedAt: new Date('2025-01-01T12:00:00.000Z').toISOString(),
    };
    const prev: TaskCardProps = {
      ...baseProps(),
      task: taskWithTimer,
      boardChrome: {...baseProps().boardChrome, liveTimerNowMs: 1},
    };
    const next: TaskCardProps = {
      ...prev,
      boardChrome: {...prev.boardChrome, liveTimerNowMs: 2},
    };
    expect(taskCardPropsAreEqual(prev, next)).toBe(false);
  });
});
