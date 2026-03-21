import {describe, expect, it} from 'vitest';
import {
  createEmptyEditorState,
  extractChecklistStats,
  lexicalDocsContentEqual,
} from './editorState';

describe('createEmptyEditorState', () => {
  it('retourne un JSON Lexical valide avec root et paragraph', () => {
    const json = createEmptyEditorState();
    const parsed = JSON.parse(json);
    expect(parsed.root).toBeDefined();
    expect(parsed.root.type).toBe('root');
    expect(Array.isArray(parsed.root.children)).toBe(true);
    expect(parsed.root.children[0].type).toBe('paragraph');
  });
});

describe('extractChecklistStats', () => {
  it('compte les listitem checklist sous root', () => {
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

  it('compte les items checklist même si checked est absent (non coché)', () => {
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

  it('ignore les listitem des listes à puces', () => {
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

describe('lexicalDocsContentEqual', () => {
  it('ignore les différences de formatage (espaces / retours ligne)', () => {
    const compact = '{"root":{"type":"root","version":1}}';
    const spaced = `{
  "root": { "type": "root", "version": 1 }
}`;
    expect(lexicalDocsContentEqual(compact, spaced)).toBe(true);
  });
});
