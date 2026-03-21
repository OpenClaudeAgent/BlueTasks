import {describe, expect, it} from 'vitest';
import {addDaysToKey, todayKey} from './date';
import {createEmptyEditorState} from './editorState';
import type {Task} from '../types';
import {
  applyRecurringStatusToggle,
  coercePinned,
  coerceRecurrence,
  createTask,
  filterTasks,
  getPreferredTaskId,
  getTaskCounts,
  getTaskSection,
  isSaveSuperseded,
  sortTasks,
  toTaskDraftPayload,
} from './tasks';
import {AREA_FILTER_ALL, AREA_FILTER_UNCATEGORIZED} from '../types';

describe('createTask', () => {
  it('crée une tâche avec contentJson valide (jamais vide)', () => {
    const task = createTask('Ma tâche');
    expect(task.contentJson).toBeTruthy();
    expect(task.contentJson.trim().length).toBeGreaterThan(0);
    const parsed = JSON.parse(task.contentJson);
    expect(parsed.root).toBeDefined();
    expect(parsed.root.children).toBeDefined();
  });

  it('n’impose pas de date ni de zone par défaut', () => {
    const task = createTask('Sans date');
    expect(task.taskDate).toBeNull();
    expect(task.areaId).toBeNull();
    const zoned = createTask('Avec zone', 'area-uuid');
    expect(zoned.areaId).toBe('area-uuid');
  });
});

describe('toTaskDraftPayload', () => {
  it('inclut contentJson dans le payload pour la sauvegarde', () => {
    const content = createEmptyEditorState();
    const task = createTask('Test');
    const taskWithContent = {...task, contentJson: content};
    const payload = toTaskDraftPayload(taskWithContent);
    expect(payload.contentJson).toBe(content);
  });

  it('normalise pinned numérique (ex. lecture SQLite) en booléen', () => {
    const base = createTask('Pin');
    const task = {...base, id: 'pin-test', pinned: 1 as unknown as boolean};
    expect(toTaskDraftPayload(task).pinned).toBe(true);
  });
});

describe('isSaveSuperseded', () => {
  it('détecte une édition plus récente pendant le vol du PUT', () => {
    expect(isSaveSuperseded(1, {rev: 1})).toBe(false);
    expect(isSaveSuperseded(1, {rev: 2})).toBe(true);
  });
});

describe('coercePinned', () => {
  it('interprète correctement les valeurs style SQLite / chaîne', () => {
    expect(coercePinned(1)).toBe(true);
    expect(coercePinned(0)).toBe(false);
    expect(coercePinned('1')).toBe(true);
    expect(coercePinned('0')).toBe(false);
    expect(coercePinned(true)).toBe(true);
    expect(coercePinned(false)).toBe(false);
  });
});

describe('sortTasks', () => {
  it('met les tâches épinglées au-dessus des autres, quelle que soit la date', () => {
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

  it('ne réordonne pas sur updatedAt (tie-break stable via createdAt)', () => {
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
});

describe('applyRecurringStatusToggle', () => {
  it('avance la date d’échéance au lieu de passer en terminé quand une récurrence est définie', () => {
    const day = todayKey();
    const task: Task = {
      ...createTask('X'),
      id: 'r1',
      taskDate: day,
      recurrence: 'weekly',
    };
    const next = applyRecurringStatusToggle(task);
    expect(next.status).toBe('pending');
    expect(next.taskDate).toBe(addDaysToKey(day, 7));
  });

  it('bascule pending ↔ completed sans récurrence', () => {
    const pending = {...createTask('S'), id: 'p1', recurrence: null};
    const done = applyRecurringStatusToggle(pending);
    expect(done.status).toBe('completed');
    expect(applyRecurringStatusToggle(done).status).toBe('pending');
  });
});

describe('filterTasks', () => {
  it('ne mélange pas les tâches entre sections', () => {
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

  it('filtre par zone et sans zone', () => {
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
  it('accepte les kinds valides et refuse le reste', () => {
    expect(coerceRecurrence('weekly')).toBe('weekly');
    expect(coerceRecurrence('invalid')).toBeNull();
    expect(coerceRecurrence(null)).toBeNull();
  });
});

describe('getTaskCounts', () => {
  it('compte par section avec filtre de zone', () => {
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
  it('classe today / upcoming / anytime / done', () => {
    const today = todayKey();
    const future = addDaysToKey(today, 3);
    expect(getTaskSection({...createTask(''), status: 'completed'} as Task)).toBe('done');
    expect(getTaskSection({...createTask(''), taskDate: null} as Task)).toBe('anytime');
    expect(getTaskSection({...createTask(''), taskDate: today} as Task)).toBe('today');
    expect(getTaskSection({...createTask(''), taskDate: future} as Task)).toBe('upcoming');
  });
});

describe('getPreferredTaskId', () => {
  it('retient la sélection visible ou la première tâche', () => {
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
