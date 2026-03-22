import {describe, expect, it} from 'vitest';
import {CATEGORY_ICON_IDS, normalizeCategoryIcon} from './categoryIconIds.js';

describe('categoryIconIds', () => {
  it('normalizeCategoryIcon falls back to folder', () => {
    expect(normalizeCategoryIcon('__nope__')).toBe('folder');
    expect(normalizeCategoryIcon(null)).toBe('folder');
  });

  it('every canonical id round-trips', () => {
    for (const id of CATEGORY_ICON_IDS) {
      expect(normalizeCategoryIcon(id)).toBe(id);
    }
  });
});
