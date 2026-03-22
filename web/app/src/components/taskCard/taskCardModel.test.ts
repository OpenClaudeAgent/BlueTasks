import {describe, expect, it} from 'vitest';
import {categoryNameByIdMap, checklistCompletionRatio} from './taskCardModel';

describe('checklistCompletionRatio', () => {
  it('returns 0 when total is 0', () => {
    expect(checklistCompletionRatio(3, 0)).toBe(0);
  });

  it('returns rounded percentage', () => {
    expect(checklistCompletionRatio(1, 3)).toBe(33);
    expect(checklistCompletionRatio(3, 4)).toBe(75);
  });
});

describe('categoryNameByIdMap', () => {
  it('maps category ids to names', () => {
    const map = categoryNameByIdMap([
      {id: 'a1', name: 'Work', icon: 'folder', sortIndex: 0, createdAt: ''},
      {id: 'a2', name: 'Home', icon: 'heart', sortIndex: 1, createdAt: ''},
    ]);
    expect(map).toEqual({a1: 'Work', a2: 'Home'});
  });

  it('returns empty object for empty list', () => {
    expect(categoryNameByIdMap([])).toEqual({});
  });
});
