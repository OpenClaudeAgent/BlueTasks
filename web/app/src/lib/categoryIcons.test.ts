import {describe, expect, it} from 'vitest';
import {CATEGORY_ICON_IDS, coerceCategoryIcon, isCategoryIconId} from './categoryIcons';

describe('categoryIcons', () => {
  it('every canonical id is accepted by isCategoryIconId', () => {
    for (const id of CATEGORY_ICON_IDS) {
      expect(isCategoryIconId(id)).toBe(true);
    }
  });

  it('coerceCategoryIcon falls back to folder', () => {
    expect(coerceCategoryIcon('__nope__')).toBe('folder');
    expect(coerceCategoryIcon(null)).toBe('folder');
  });
});
