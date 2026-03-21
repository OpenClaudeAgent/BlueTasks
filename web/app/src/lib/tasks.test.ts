import {describe, expect, it} from 'vitest';
import {addDaysToKey, todayKey} from './dateKeys';
import {createEmptyEditorState} from './editorState';
import type {Task} from '../types';
import {
  applySavedTaskPreservingLexicalShape,
  coercePinned,
  coerceRecurrence,
  createTask,
  filterTasks,
  getPreferredTaskId,
  getTaskCounts,
  getTaskSection,
  isSaveSuperseded,
  mergeTaskFromApi,
  sortTasks,
  toTaskDraftPayload,
} from './tasks';
import {AREA_FILTER_ALL, AREA_FILTER_UNCATEGORIZED} from '../types';

describe('createTask', () => {
  it('creates a task with valid non-empty contentJson', () => {
    const task = createTask('Ma tâche');
    expect(task.contentJson.trim().length).toBeGreaterThan(0);
    const parsed = JSON.parse(task.contentJson) as {root: unknown};
    expect(parsed).toMatchObject({
      root: {
        type: 'root',
        version: 1,
        children: [
          {
            type: 'paragraph',
            version: 1,
            children: [],
          },
        ],
      },
    });
  });

  it('does not set taskDate or areaId by default', () => {
    const task = createTask('Sans date');
    expect(task.taskDate).toBeNull();
    expect(task.areaId).toBeNull();
    const zoned = createTask('Avec zone', 'area-uuid');
    expect(zoned.areaId).toBe('area-uuid');
  });
});

describe('Feature: Task draft payload for API', () => {
  describe('Scenario: Client sends a PUT body', () => {
    it('given contentJson set, when toTaskDraftPayload runs, then payload mirrors it', () => {
      const content = createEmptyEditorState();
      const task = createTask('Test');
      const taskWithContent = {...task, contentJson: content};
      const payload = toTaskDraftPayload(taskWithContent);
      expect(payload.contentJson).toBe(content);
    });

    it('given numeric pinned from SQLite, when toTaskDraftPayload runs, then pinned is boolean true', () => {
      const base = createTask('Pin');
      const task = {...base, id: 'pin-test', pinned: 1 as unknown as boolean};
      expect(toTaskDraftPayload(task).pinned).toBe(true);
    });

    it('given empty string areaId, when toTaskDraftPayload runs, then areaId is null', () => {
      const task = {...createTask('Z'), id: 'area-empty', areaId: ''};
      expect(toTaskDraftPayload(task).areaId).toBeNull();
    });
  });
});

describe('Feature: Normalize task from API', () => {
  describe('Scenario: SQLite / JSON oddities', () => {
    it('given null priority and numeric pinned, when mergeTaskFromApi runs, then fields are normalized', () => {
      const base = createTask('API');
      const raw = {
        ...base,
        id: 'n1',
        priority: null as unknown as Task['priority'],
        pinned: 1 as unknown as boolean,
        timeSpentSeconds: null as unknown as number,
        recurrence: 'bogus' as unknown as Task['recurrence'],
        areaId: '' as unknown as string | null,
      };
      const merged = mergeTaskFromApi(raw as Task);
      expect(merged.priority).toBe('normal');
      expect(merged.pinned).toBe(true);
      expect(merged.timeSpentSeconds).toBe(0);
      expect(merged.recurrence).toBeNull();
      expect(merged.areaId).toBeNull();
    });
  });
});

describe('Feature: After save, preserve local Lexical JSON shape', () => {
  describe('Scenario: Server echoes equivalent editor JSON', () => {
    it('given pretty-printed local JSON and minified remote JSON, when applySavedTaskPreservingLexicalShape runs, then local JSON and text are kept', () => {
      const minified = createEmptyEditorState();
      const pretty = JSON.stringify(JSON.parse(minified), null, 2);
      const local = {...createTask('Lex'), id: 'l1', contentJson: pretty, contentText: 'Note'};
      const saved = mergeTaskFromApi({
        ...local,
        contentJson: minified,
        contentText: 'Note',
      });
      const result = applySavedTaskPreservingLexicalShape(local, saved);
      expect(result.contentJson).toBe(pretty);
      expect(result.contentText).toBe('Note');
      expect(result.id).toBe('l1');
    });

    it('given different semantic editor content, when applySavedTaskPreservingLexicalShape runs, then server copy wins', () => {
      const local = {...createTask('L2'), id: 'l2', contentJson: createEmptyEditorState(), contentText: ''};
      const remoteJson = JSON.stringify({
        root: {
          type: 'root',
          version: 1,
          children: [{type: 'paragraph', version: 1, children: [{type: 'text', text: 'Remote', version: 1}]}],
          direction: null,
          format: '',
          indent: 0,
        },
      });
      const saved = mergeTaskFromApi({...local, contentJson: remoteJson, contentText: 'Remote'});
      const result = applySavedTaskPreservingLexicalShape(local, saved);
      expect(result.contentJson).toBe(remoteJson);
      expect(result.contentText).toBe('Remote');
    });
  });
});

describe('isSaveSuperseded', () => {
  it('detects a newer revision while the PUT is in flight', () => {
    expect(isSaveSuperseded(1, {rev: 1})).toBe(false);
    expect(isSaveSuperseded(1, {rev: 2})).toBe(true);
  });
});

describe('coercePinned', () => {
  it('coerces SQLite-style and string pinned values', () => {
    expect(coercePinned(1)).toBe(true);
    expect(coercePinned(0)).toBe(false);
    expect(coercePinned('1')).toBe(true);
    expect(coercePinned('0')).toBe(false);
    expect(coercePinned(true)).toBe(true);
    expect(coercePinned(false)).toBe(false);
  });
});

describe('sortTasks', () => {
  it('sorts pinned tasks above others regardless of date', () => {
    const common = {
      status: 'pending' as const,
      contentJson: createEmptyEditorState(),
      contentText: '',
      checklistTotal: 0,
      checklistCompleted: 0,
      priority: 'normal' as const,
      estimateMinutes: null,
      timeSpentSeconds: 0,
      timerStartedAt: null,
      recurrence: null,
      createdAt: '2025-03-01T12:00:00.000Z',
      updatedAt: '2025-03-01T12:00:00.000Z',
    };
    const latePinned: Task = {
      ...common,
      id: 'p',
      title: 'P',
      pinned: true,
      taskDate: '2099-01-01',
    };
    const earlyOpen: Task = {
      ...common,
      id: 'u',
      title: 'U',
      pinned: false,
      taskDate: '2020-01-01',
    };
    expect(sortTasks([earlyOpen, latePinned]).map((t) => t.id)).toEqual(['p', 'u']);
  });

  it('does not reorder by updatedAt (stable tie-break via createdAt)', () => {
    const day = todayKey();
    const common = {
      status: 'pending' as const,
      taskDate: day,
      pinned: false,
      contentJson: createEmptyEditorState(),
      contentText: '',
      checklistTotal: 0,
      checklistCompleted: 0,
      priority: 'normal' as const,
      estimateMinutes: null,
      timeSpentSeconds: 0,
      timerStartedAt: null,
      recurrence: null,
    };
    const older: Task = {
      ...common,
      id: 'old',
      title: 'Older',
      createdAt: '2025-01-01T10:00:00.000Z',
      updatedAt: '2025-06-01T20:00:00.000Z',
    };
    const newer: Task = {
      ...common,
      id: 'new',
      title: 'Newer',
      createdAt: '2025-02-01T10:00:00.000Z',
      updatedAt: '2025-01-01T10:00:00.000Z',
    };
    expect(sortTasks([newer, older]).map((t) => t.id)).toEqual(['old', 'new']);
  });

  it('places completed tasks after pending when dates match', () => {
    const day = todayKey();
    const common = {
      taskDate: day,
      pinned: false,
      contentJson: createEmptyEditorState(),
      contentText: '',
      checklistTotal: 0,
      checklistCompleted: 0,
      priority: 'normal' as const,
      estimateMinutes: null,
      timeSpentSeconds: 0,
      timerStartedAt: null,
      recurrence: null,
      createdAt: '2025-01-01T10:00:00.000Z',
      updatedAt: '2025-01-01T10:00:00.000Z',
    };
    const pending: Task = {...common, id: 'pen', title: 'Open', status: 'pending'};
    const done: Task = {...common, id: 'done', title: 'Closed', status: 'completed'};
    expect(sortTasks([done, pending]).map((t) => t.id)).toEqual(['pen', 'done']);
  });
});

describe('filterTasks', () => {
  it('keeps tasks in the correct section when filtering', () => {
    const today = todayKey();
    const tasks = [
      {...createTask('A'), id: '1', taskDate: today},
      {...createTask('B'), id: '2', taskDate: addDaysToKey(today, 7)},
      {...createTask('C'), id: '3', taskDate: null},
    ];
    const todayTasks = filterTasks(tasks, 'today');
    expect(todayTasks.map((t) => t.id)).toContain('1');
    const upcomingTasks = filterTasks(tasks, 'upcoming');
    expect(upcomingTasks.map((t) => t.id)).toContain('2');
    const anytimeTasks = filterTasks(tasks, 'anytime');
    expect(anytimeTasks.map((t) => t.id)).toContain('3');
  });

  it('filters by area and uncategorized', () => {
    const today = todayKey();
    const z1 = 'zone-1';
    const tasks = [
      {...createTask('Dans Z1'), id: 'a', taskDate: today, areaId: z1},
      {...createTask('Sans zone'), id: 'b', taskDate: today, areaId: null},
    ];
    expect(filterTasks(tasks, 'today', z1).map((t) => t.id)).toEqual(['a']);
    expect(filterTasks(tasks, 'today', AREA_FILTER_UNCATEGORIZED).map((t) => t.id)).toEqual(['b']);
  });
});

describe('coerceRecurrence', () => {
  it('accepts valid recurrence kinds and rejects invalid ones', () => {
    expect(coerceRecurrence('weekly')).toBe('weekly');
    expect(coerceRecurrence('invalid')).toBeNull();
    expect(coerceRecurrence(null)).toBeNull();
  });
});

describe('getTaskCounts', () => {
  it('counts tasks per section with area filter', () => {
    const today = todayKey();
    const z = 'z99';
    const tasks = [
      {...createTask('T1'), id: '1', taskDate: today, areaId: z},
      {...createTask('T2'), id: '2', taskDate: null, areaId: z},
      {...createTask('T3'), id: '3', taskDate: today, areaId: null},
    ];
    const all = getTaskCounts(tasks, AREA_FILTER_ALL);
    expect(all.today).toBe(2);
    expect(all.anytime).toBe(1);
    const zOnly = getTaskCounts(tasks, z);
    expect(zOnly.today).toBe(1);
    expect(zOnly.anytime).toBe(1);
  });
});

describe('getTaskSection', () => {
  it('maps tasks to today / upcoming / anytime / done', () => {
    const today = todayKey();
    const future = addDaysToKey(today, 3);
    expect(getTaskSection({...createTask(''), status: 'completed'} as Task)).toBe('done');
    expect(getTaskSection({...createTask(''), taskDate: null} as Task)).toBe('anytime');
    expect(getTaskSection({...createTask(''), taskDate: today} as Task)).toBe('today');
    expect(getTaskSection({...createTask(''), taskDate: future} as Task)).toBe('upcoming');
  });
});

describe('getPreferredTaskId', () => {
  it('keeps the visible selection or falls back to the first task', () => {
    const today = todayKey();
    const tasks = [
      {...createTask('A'), id: 'x', taskDate: today},
      {...createTask('B'), id: 'y', taskDate: today},
    ];
    expect(getPreferredTaskId(tasks, 'today', 'y', AREA_FILTER_ALL)).toBe('y');
    expect(getPreferredTaskId(tasks, 'today', 'absent', AREA_FILTER_ALL)).toBe('x');
    expect(getPreferredTaskId([], 'today', 'x', AREA_FILTER_ALL)).toBeNull();
  });
});
