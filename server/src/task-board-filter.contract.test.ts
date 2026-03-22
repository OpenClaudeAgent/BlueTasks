import {describe, expect, it} from 'vitest';
import {
  FILTER_CATEGORY_ALL,
  FILTER_CATEGORY_UNCATEGORIZED,
  getTaskSectionBucket,
  taskMatchesBoardSectionRow,
  taskMatchesCategoryFilterRow,
} from '../../contract/task-board-filter.js';

describe('contract task-board-filter', () => {
  const today = '2025-06-15';

  describe('taskMatchesCategoryFilterRow', () => {
    it('matches all categories', () => {
      const task = {categoryId: 'z1' as string | null, status: 'pending' as const, taskDate: null};
      expect(taskMatchesCategoryFilterRow(task, FILTER_CATEGORY_ALL)).toBe(true);
    });

    it('matches uncategorized', () => {
      const task = {categoryId: null, status: 'pending' as const, taskDate: null};
      expect(taskMatchesCategoryFilterRow(task, FILTER_CATEGORY_UNCATEGORIZED)).toBe(true);
      expect(taskMatchesCategoryFilterRow({...task, categoryId: 'z'}, FILTER_CATEGORY_UNCATEGORIZED)).toBe(
        false,
      );
    });

    it('matches specific category id', () => {
      const task = {categoryId: 'z1', status: 'pending' as const, taskDate: null};
      expect(taskMatchesCategoryFilterRow(task, 'z1')).toBe(true);
      expect(taskMatchesCategoryFilterRow(task, 'z2')).toBe(false);
    });
  });

  describe('taskMatchesBoardSectionRow', () => {
    it('all includes pending and completed', () => {
      const pending = {status: 'pending' as const, taskDate: today, categoryId: 'z1'};
      const done = {status: 'completed' as const, taskDate: today, categoryId: 'z1'};
      expect(taskMatchesBoardSectionRow(pending, 'all', today)).toBe(true);
      expect(taskMatchesBoardSectionRow(done, 'all', today)).toBe(true);
    });

    it('done excludes pending', () => {
      const pending = {status: 'pending' as const, taskDate: today, categoryId: null};
      expect(taskMatchesBoardSectionRow(pending, 'done', today)).toBe(false);
      expect(taskMatchesBoardSectionRow({...pending, status: 'completed'}, 'done', today)).toBe(
        true,
      );
    });

    it('today uses calendar key vs today string', () => {
      const pending = {status: 'pending' as const, taskDate: today, categoryId: null};
      const future = {status: 'pending' as const, taskDate: '2099-01-01', categoryId: null};
      expect(taskMatchesBoardSectionRow(pending, 'today', today)).toBe(true);
      expect(taskMatchesBoardSectionRow(future, 'today', today)).toBe(false);
    });
  });

  describe('getTaskSectionBucket', () => {
    it('classifies buckets', () => {
      expect(
        getTaskSectionBucket({status: 'completed', taskDate: today, categoryId: null}, today),
      ).toBe('done');
      expect(getTaskSectionBucket({status: 'pending', taskDate: null, categoryId: null}, today)).toBe(
        'anytime',
      );
      expect(getTaskSectionBucket({status: 'pending', taskDate: today, categoryId: null}, today)).toBe(
        'today',
      );
      expect(
        getTaskSectionBucket({status: 'pending', taskDate: '2099-01-01', categoryId: null}, today),
      ).toBe('upcoming');
    });
  });
});
