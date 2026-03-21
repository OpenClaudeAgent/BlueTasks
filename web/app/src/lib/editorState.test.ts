import {describe, expect, it} from 'vitest';
import {
  createEmptyEditorState,
  extractChecklistStats,
  lexicalDocsContentEqual,
  summarizeText,
} from './editorState';

describe('createEmptyEditorState', () => {
  it('returns valid Lexical JSON with root and paragraph', () => {
    const json = createEmptyEditorState();
    const parsed = JSON.parse(json);
    expect(parsed).toEqual({
      root: {
        children: [
          {
            children: [],
            direction: null,
            format: '',
            indent: 0,
            type: 'paragraph',
            version: 1,
          },
        ],
        direction: null,
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    });
  });
});

describe('extractChecklistStats', () => {
  it('counts checklist listitems under root', () => {
    const state = {
      root: {
        type: 'root',
        version: 1,
        children: [
          {
            type: 'list',
            listType: 'check',
            version: 1,
            children: [
              {type: 'listitem', version: 1, checked: true, children: []},
              {type: 'listitem', version: 1, checked: false, children: []},
            ],
          },
        ],
        direction: null,
        format: '',
        indent: 0,
      },
    };
    expect(extractChecklistStats(state)).toEqual({
      checklistTotal: 2,
      checklistCompleted: 1,
    });
  });

  it('counts checklist items when checked is absent (treated as unchecked)', () => {
    const state = {
      root: {
        type: 'root',
        version: 1,
        children: [
          {
            type: 'list',
            listType: 'check',
            version: 1,
            children: [
              {type: 'listitem', version: 1, value: 1, children: []},
              {type: 'listitem', version: 1, value: 2, checked: true, children: []},
            ],
          },
        ],
        direction: null,
        format: '',
        indent: 0,
      },
    };
    expect(extractChecklistStats(state)).toEqual({checklistTotal: 2, checklistCompleted: 1});
  });

  it('ignores listitems in bullet lists', () => {
    const state = {
      root: {
        type: 'root',
        version: 1,
        children: [
          {
            type: 'list',
            listType: 'bullet',
            version: 1,
            children: [{type: 'listitem', version: 1, value: 1, children: []}],
          },
        ],
        direction: null,
        format: '',
        indent: 0,
      },
    };
    expect(extractChecklistStats(state)).toEqual({checklistTotal: 0, checklistCompleted: 0});
  });
});

describe('Feature: Plain text summary for editor', () => {
  describe('Scenario: Collapse whitespace', () => {
    it('given repeated spaces and newlines, when summarizeText runs, then output is a single trimmed line', () => {
      expect(summarizeText('  hello   \n  world  ')).toBe('hello world');
    });
  });
});

describe('lexicalDocsContentEqual', () => {
  it('ignores whitespace and newline formatting differences', () => {
    const compact = '{"root":{"type":"root","version":1}}';
    const spaced = `{
  "root": { "type": "root", "version": 1 }
}`;
    expect(lexicalDocsContentEqual(compact, spaced)).toBe(true);
  });
});
