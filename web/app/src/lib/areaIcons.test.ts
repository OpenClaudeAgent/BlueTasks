import {describe, expect, it} from 'vitest';
import {AREA_ICON_IDS, coerceAreaIcon, isAreaIconId} from './areaIcons';

describe('areaIcons', () => {
  it('chaque id du fichier partagé a une entrée Lucide', () => {
    for (const id of AREA_ICON_IDS) {
      expect(isAreaIconId(id), `id manquant dans ICON_MAP: ${id}`).toBe(true);
    }
  });

  it('normalise les valeurs inconnues vers folder', () => {
    expect(coerceAreaIcon('__unknown__')).toBe('folder');
    expect(coerceAreaIcon(null)).toBe('folder');
  });
});
