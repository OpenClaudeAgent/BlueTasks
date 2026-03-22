import {DEFAULT_CODE_LANGUAGE} from '@lexical/code';
import {describe, expect, it} from 'vitest';
import {
  getTaskEditorCodeLanguageOptions,
  normalizeCodeLanguage,
  resolveTaskEditorCodeLanguageValue,
  TASK_EDITOR_CODE_LANGUAGE_IDS,
} from './lexicalCodeShiki';

describe('getTaskEditorCodeLanguageOptions', () => {
  it('returns a curated non-empty list including javascript and python', () => {
    const opts = getTaskEditorCodeLanguageOptions();
    expect(opts.length).toBeGreaterThan(10);
    const ids = opts.map((o) => o.id);
    expect(ids).toContain('javascript');
    expect(ids).toContain('python');
    expect(opts.every((o) => o.label.length > 0)).toBe(true);
    expect(opts.every((o) => o.id === o.id.trim() && o.id.length > 0)).toBe(true);
  });

  it('keeps toolbar order and unique ids (subset of TASK_EDITOR_CODE_LANGUAGE_IDS)', () => {
    const opts = getTaskEditorCodeLanguageOptions();
    const ids = opts.map((o) => o.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);

    const allowedOrder = TASK_EDITOR_CODE_LANGUAGE_IDS.filter((id) => ids.includes(id));
    expect(ids).toEqual(allowedOrder);
  });
});

describe('resolveTaskEditorCodeLanguageValue', () => {
  it('maps empty, whitespace-only, null and undefined to Lexical default', () => {
    expect(resolveTaskEditorCodeLanguageValue('')).toBe(DEFAULT_CODE_LANGUAGE);
    expect(resolveTaskEditorCodeLanguageValue('   ')).toBe(DEFAULT_CODE_LANGUAGE);
    expect(resolveTaskEditorCodeLanguageValue('\t\n')).toBe(DEFAULT_CODE_LANGUAGE);
    expect(resolveTaskEditorCodeLanguageValue(null)).toBe(DEFAULT_CODE_LANGUAGE);
    expect(resolveTaskEditorCodeLanguageValue(undefined)).toBe(DEFAULT_CODE_LANGUAGE);
  });

  it('normalizes a concrete Shiki id the same way as normalizeCodeLanguage', () => {
    expect(resolveTaskEditorCodeLanguageValue('python')).toBe(normalizeCodeLanguage('python'));
  });

  it('does not collapse to Lexical default for strings that only trim to non-empty (Shiki sees inner id)', () => {
    const spaced = '  python  ';
    expect(resolveTaskEditorCodeLanguageValue(spaced)).not.toBe(DEFAULT_CODE_LANGUAGE);
    expect(resolveTaskEditorCodeLanguageValue(spaced)).toBe(normalizeCodeLanguage(spaced));
  });
});

describe('normalizeCodeLanguage (Shiki)', () => {
  it('normalizes common aliases to stable grammar ids', () => {
    expect(normalizeCodeLanguage('js')).toBe(normalizeCodeLanguage('javascript'));
    expect(normalizeCodeLanguage('ts')).toBe(normalizeCodeLanguage('typescript'));
    expect(normalizeCodeLanguage('py')).toBe(normalizeCodeLanguage('python'));
  });
});
