import {describe, expect, it} from 'vitest';
import {AREA_ICON_IDS, coerceAreaIcon, isAreaIconId} from './areaIcons';

describe('areaIcons', () => {
  it('maps every shared id to a Lucide entry', () => {
    for (const id of AREA_ICON_IDS) {
      expect(isAreaIconId(id), `missing id in ICON_MAP: ${id}`).toBe(true);
    }
  });

  it('coerces unknown values to folder', () => {
    expect(coerceAreaIcon('__unknown__')).toBe('folder');
    expect(coerceAreaIcon(null)).toBe('folder');
  });
});
