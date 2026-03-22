/** @vitest-environment jsdom */
import {describe, expect, it, vi, beforeEach} from 'vitest';
import {fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {I18nextProvider} from 'react-i18next';
import i18n from './i18n';
import App from './App';
import {useBlueTasksBoard} from './hooks/useBlueTasksBoard';
import {AREA_FILTER_ALL, AREA_FILTER_UNCATEGORIZED} from './types';
import type {Task} from './types';
import {createTask} from './lib/tasks';

vi.mock('./hooks/useBlueTasksBoard');
vi.mock('./components/LexicalTaskEditor', () => ({
  LexicalTaskEditor: () => <div data-testid="lexical-editor-mock" />,
}));

function baseBoard() {
  return {
    areas: [],
    areaFilter: AREA_FILTER_ALL,
    setAreaFilter: vi.fn(),
    selectedSection: 'today' as const,
    setSelectedSection: vi.fn(),
    selectedTaskId: null as string | null,
    setSelectedTaskId: vi.fn(),
    titleFocusTaskId: null as string | null,
    setTitleFocusTaskId: vi.fn(),
    loading: false,
    errorMessage: null as string | null,
    savingIds: {} as Record<string, boolean>,
    visibleTasks: [] as Task[],
    counts: {all: 0, today: 0, upcoming: 0, anytime: 0, done: 0},
    taskCountByAreaId: {} as Record<string, number>,
    areaSidebarCounts: {all: 0, uncategorized: 0, byId: {} as Record<string, number>},
    refreshTasksAndAreas: vi.fn(),
    handleAddTask: vi.fn(),
    handleQuickCapture: vi.fn().mockResolvedValue(undefined),
    handleTaskDraftChange: vi.fn(),
    handleToggleRecurringStatus: vi.fn(),
    handleDelete: vi.fn(),
    toggleTaskExpanded: vi.fn(),
    clearTitleFocusTaskId: vi.fn(),
    datePopoverTaskId: null as string | null,
    setDatePopoverTaskId: vi.fn(),
    liveTimerNowMs: 0,
  };
}

describe('Feature: App shell', () => {
  beforeEach(() => {
    vi.mocked(useBlueTasksBoard).mockReturnValue(baseBoard());
  });

  it('Scenario: Board ready — shows primary navigation and section heading', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>,
    );
    expect(screen.getByRole('navigation', {name: /primary navigation/i})).toBeVisible();
    expect(screen.getByRole('heading', {level: 1, name: /today/i})).toBeVisible();
  });

  it('Scenario: Board errorMessage — renders appError banner', () => {
    vi.mocked(useBlueTasksBoard).mockReturnValue({
      ...baseBoard(),
      errorMessage: 'Sync failed',
    });
    render(
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>,
    );
    const banner = screen.getByText('Sync failed');
    expect(banner).toHaveClass('appError');
  });

  it('Scenario: Loading — shows spinner empty state', () => {
    vi.mocked(useBlueTasksBoard).mockReturnValue({
      ...baseBoard(),
      loading: true,
      visibleTasks: [],
    });
    render(
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>,
    );
    expect(screen.getByText('Loading tasks...')).toBeVisible();
  });

  it('Scenario: Quick capture — Enter with text calls handleQuickCapture', async () => {
    const user = userEvent.setup();
    const handleQuickCapture = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useBlueTasksBoard).mockReturnValue({
      ...baseBoard(),
      handleQuickCapture,
    });
    render(
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>,
    );
    const input = screen.getByRole('textbox', {name: /capture a task/i});
    await user.type(input, '  Hi  ');
    await user.keyboard('{Enter}');
    expect(handleQuickCapture).toHaveBeenCalledWith('Hi');
  });

  it('Scenario: Quick capture — Enter does not submit while board is loading', () => {
    const handleQuickCapture = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useBlueTasksBoard).mockReturnValue({
      ...baseBoard(),
      loading: true,
      handleQuickCapture,
    });
    render(
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>,
    );
    const input = screen.getByRole('textbox', {name: /capture a task/i});
    fireEvent.change(input, {target: {value: 'Later'}});
    fireEvent.keyDown(input, {key: 'Enter'});
    expect(handleQuickCapture).not.toHaveBeenCalled();
  });

  it('Scenario: Header add task — calls handleAddTask', async () => {
    const user = userEvent.setup();
    const handleAddTask = vi.fn();
    vi.mocked(useBlueTasksBoard).mockReturnValue({
      ...baseBoard(),
      handleAddTask,
    });
    render(
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>,
    );
    await user.click(screen.getByRole('button', {name: /add task/i}));
    expect(handleAddTask).toHaveBeenCalled();
  });

  it('Scenario: Sidebar settings — opens settings dialog', async () => {
    const user = userEvent.setup();
    render(
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>,
    );
    await user.click(
      within(screen.getByRole('complementary')).getByRole('button', {name: /settings/i}),
    );
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeVisible();
    });
  });

  it('Scenario: Task title autofocus — clears titleFocusTaskId after consume', async () => {
    const setTitleFocusTaskId = vi.fn();
    const task = createTask('Autofocus');
    vi.mocked(useBlueTasksBoard).mockReturnValue({
      ...baseBoard(),
      visibleTasks: [task],
      selectedTaskId: task.id,
      titleFocusTaskId: task.id,
      setTitleFocusTaskId,
      clearTitleFocusTaskId: vi.fn(() => {
        setTitleFocusTaskId(null);
      }),
    });
    render(
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>,
    );
    await waitFor(() => {
      expect(setTitleFocusTaskId).toHaveBeenCalledWith(null);
    });
  });

  it('Scenario: Task card expand — toggles selected task via board setter', async () => {
    const user = userEvent.setup();
    const setSelectedTaskId = vi.fn();
    const task = createTask('Expand me');
    vi.mocked(useBlueTasksBoard).mockReturnValue({
      ...baseBoard(),
      visibleTasks: [task],
      selectedTaskId: null,
      setSelectedTaskId,
      toggleTaskExpanded: (taskId: string) => {
        setSelectedTaskId((current: string | null) => (current === taskId ? null : taskId));
      },
    });
    render(
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>,
    );
    await user.click(screen.getByRole('button', {name: /expand task/i}));
    expect(setSelectedTaskId).toHaveBeenCalled();
    const updater = setSelectedTaskId.mock.calls.at(-1)?.[0];
    expect(typeof updater).toBe('function');
    expect((updater as (c: string | null) => string | null)(null)).toBe(task.id);
    expect((updater as (c: string | null) => string | null)(task.id)).toBe(null);
  });

  it('Scenario: Empty task list — shows section empty state message', () => {
    vi.mocked(useBlueTasksBoard).mockReturnValue({
      ...baseBoard(),
      visibleTasks: [],
      loading: false,
    });
    render(
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>,
    );
    expect(screen.getByText('Nothing urgent is waiting right now.')).toBeVisible();
  });

  it('Scenario: User focuses a single project area — sidebar asks the board to filter by that area', async () => {
    const user = userEvent.setup();
    const setAreaFilter = vi.fn();
    const workArea = {
      id: 'area-work',
      name: 'Work',
      icon: 'folder' as const,
      sortIndex: 0,
      createdAt: '2025-01-01T00:00:00.000Z',
    };
    vi.mocked(useBlueTasksBoard).mockReturnValue({
      ...baseBoard(),
      areas: [workArea],
      areaFilter: AREA_FILTER_ALL,
      setAreaFilter,
      areaSidebarCounts: {all: 3, uncategorized: 0, byId: {'area-work': 2}},
    });
    render(
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>,
    );
    const areasGroup = screen.getByRole('group', {name: /^areas$/i});
    await user.click(within(areasGroup).getByRole('button', {name: /^work/i}));
    expect(setAreaFilter).toHaveBeenCalledWith('area-work');
  });

  it('Scenario: User isolates tasks without a project — sidebar filters to Unassigned', async () => {
    const user = userEvent.setup();
    const setAreaFilter = vi.fn();
    vi.mocked(useBlueTasksBoard).mockReturnValue({
      ...baseBoard(),
      areaFilter: AREA_FILTER_ALL,
      setAreaFilter,
      areaSidebarCounts: {all: 10, uncategorized: 3, byId: {}},
    });
    render(
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>,
    );
    const areasGroup = screen.getByRole('group', {name: /^areas$/i});
    await user.click(within(areasGroup).getByRole('button', {name: /unassigned/i}));
    expect(setAreaFilter).toHaveBeenCalledWith(AREA_FILTER_UNCATEGORIZED);
  });

  it('Scenario: User reviews future due dates — primary nav switches to Upcoming', async () => {
    const user = userEvent.setup();
    const setSelectedSection = vi.fn();
    vi.mocked(useBlueTasksBoard).mockReturnValue({
      ...baseBoard(),
      selectedSection: 'today' as const,
      setSelectedSection,
      counts: {all: 12, today: 2, upcoming: 5, anytime: 3, done: 2},
    });
    render(
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>,
    );
    const mainNav = screen.getByRole('navigation', {name: /primary navigation/i});
    await user.click(within(mainNav).getByRole('button', {name: /upcoming/i}));
    expect(setSelectedSection).toHaveBeenCalledWith('upcoming');
  });

  it('Scenario: User returns to all areas — sidebar selects the combined view', async () => {
    const user = userEvent.setup();
    const setAreaFilter = vi.fn();
    vi.mocked(useBlueTasksBoard).mockReturnValue({
      ...baseBoard(),
      areas: [],
      areaFilter: AREA_FILTER_UNCATEGORIZED,
      setAreaFilter,
      areaSidebarCounts: {all: 5, uncategorized: 1, byId: {}},
    });
    render(
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>,
    );
    const areasGroup = screen.getByRole('group', {name: /^areas$/i});
    await user.click(within(areasGroup).getByRole('button', {name: /all areas/i}));
    expect(setAreaFilter).toHaveBeenCalledWith(AREA_FILTER_ALL);
  });

  it('Scenario: One visible task — renders TaskCard', () => {
    const task = createTask('Visible');
    vi.mocked(useBlueTasksBoard).mockReturnValue({
      ...baseBoard(),
      visibleTasks: [task],
      selectedTaskId: null,
    });
    render(
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>,
    );
    const articles = screen.getAllByRole('article');
    expect(articles.length).toBeGreaterThanOrEqual(1);
    expect(within(articles[0]!).getByRole('button', {name: /expand task/i})).toBeVisible();
  });
});
