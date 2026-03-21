import {describe, expect, it} from 'vitest';
import {AREA_ICON_IDS, normalizeAreaIcon} from './areaIconIds.js';

describe('areaIconIds', () => {
  it('normalizes unknown icons to folder', () => {
    expect(normalizeAreaIcon('__nope__')).toBe('folder');
    expect(normalizeAreaIcon(null)).toBe('folder');
  });

  it('accepts every canonical id', () => {
    for (const id of AREA_ICON_IDS) {
      expect(normalizeAreaIcon(id)).toBe(id);
    }
  });
});
