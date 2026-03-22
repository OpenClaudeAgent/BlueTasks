/** @vitest-environment jsdom */
import {de, enUS, es, fr as frLocale, it as itLocale, ja, nl, pl, pt} from 'date-fns/locale';
import {describe, expect, it} from 'vitest';
import {dayPickerLocaleFor} from './dayPickerLocale';

describe('dayPickerLocaleFor', () => {
  it.each([
    ['fr', frLocale],
    ['fr-CA', frLocale],
    ['de', de],
    ['de-AT', de],
    ['es', es],
    ['it', itLocale],
    ['nl', nl],
    ['pl', pl],
    ['pt', pt],
    ['pt-BR', pt],
    ['ja', ja],
    ['JA-jp', ja],
  ] as const)('Given %s When dayPickerLocaleFor Then returns matching date-fns locale', (lng, expected) => {
    expect(dayPickerLocaleFor(lng)).toBe(expected);
  });

  it('Given unknown or English When dayPickerLocaleFor Then returns enUS', () => {
    expect(dayPickerLocaleFor('en')).toBe(enUS);
    expect(dayPickerLocaleFor('en-US')).toBe(enUS);
    expect(dayPickerLocaleFor('')).toBe(enUS);
    expect(dayPickerLocaleFor('xx')).toBe(enUS);
  });
});
