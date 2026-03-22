import {describe, expect, it} from 'vitest';
import {
  FILTER_AREA_ALL,
  FILTER_AREA_UNCATEGORIZED,
  getTaskSectionBucket,
  taskMatchesAreaFilterRow,
  taskMatchesBoardSectionRow,
} from '../../contract/task-board-filter.js';

describe('contract task-board-filter', () => {
  const today = '2025-06-15';

  describe('taskMatchesAreaFilterRow', () => {
    it('matches all areas', () => {
      const task = {areaId: 'z1' as string | null, status: 'pending' as const, taskDate: null};
      expect(taskMatchesAreaFilterRow(task, FILTER_AREA_ALL)).toBe(true);
    });

    it('matches uncategorized', () => {
      const task = {areaId: null, status: 'pending' as const, taskDate: null};
      expect(taskMatchesAreaFilterRow(task, FILTER_AREA_UNCATEGORIZED)).toBe(true);
      expect(taskMatchesAreaFilterRow({...task, areaId: 'z'}, FILTER_AREA_UNCATEGORIZED)).toBe(
        false,
      );
    });

    it('matches specific area id', () => {
      const task = {areaId: 'z1', status: 'pending' as const, taskDate: null};
      expect(taskMatchesAreaFilterRow(task, 'z1')).toBe(true);
      expect(taskMatchesAreaFilterRow(task, 'z2')).toBe(false);
    });
  });

  describe('taskMatchesBoardSectionRow', () => {
    it('all includes pending and completed', () => {
      const pending = {status: 'pending' as const, taskDate: today, areaId: 'z1'};
      const done = {status: 'completed' as const, taskDate: today, areaId: 'z1'};
      expect(taskMatchesBoardSectionRow(pending, 'all', today)).toBe(true);
      expect(taskMatchesBoardSectionRow(done, 'all', today)).toBe(true);
    });

    it('done excludes pending', () => {
      const pending = {status: 'pending' as const, taskDate: today, areaId: null};
      expect(taskMatchesBoardSectionRow(pending, 'done', today)).toBe(false);
      expect(taskMatchesBoardSectionRow({...pending, status: 'completed'}, 'done', today)).toBe(
        true,
      );
    });

    it('today uses calendar key vs today string', () => {
      const pending = {status: 'pending' as const, taskDate: today, areaId: null};
      const future = {status: 'pending' as const, taskDate: '2099-01-01', areaId: null};
      expect(taskMatchesBoardSectionRow(pending, 'today', today)).toBe(true);
      expect(taskMatchesBoardSectionRow(future, 'today', today)).toBe(false);
    });
  });

  describe('getTaskSectionBucket', () => {
    it('classifies buckets', () => {
      expect(
        getTaskSectionBucket({status: 'completed', taskDate: today, areaId: null}, today),
      ).toBe('done');
      expect(getTaskSectionBucket({status: 'pending', taskDate: null, areaId: null}, today)).toBe(
        'anytime',
      );
      expect(getTaskSectionBucket({status: 'pending', taskDate: today, areaId: null}, today)).toBe(
        'today',
      );
      expect(
        getTaskSectionBucket({status: 'pending', taskDate: '2099-01-01', areaId: null}, today),
      ).toBe('upcoming');
    });
  });
});
