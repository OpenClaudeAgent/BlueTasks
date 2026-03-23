import {describe, expect, it} from 'vitest';
import {
  assertApiCategoryRowContract,
  assertApiTaskRowContract,
} from '../../contract/api-contract-validation.js';

/** Minimal Lexical document JSON (non-empty, parseable). */
const minimalLexical =
  '{"root":{"children":[{"children":[],"direction":null,"format":"","indent":0,"type":"paragraph","version":1}],"direction":null,"format":"","indent":0,"type":"root","version":1}}';

function validTask(over: Record<string, unknown> = {}) {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    title: 'Task',
    status: 'pending' as const,
    taskDate: null,
    contentJson: minimalLexical,
    contentText: '',
    checklistTotal: 2,
    checklistCompleted: 1,
    priority: 'normal' as const,
    estimateMinutes: null,
    pinned: true,
    timeSpentSeconds: 42,
    timerStartedAt: null,
    recurrence: 'weekly' as const,
    categoryId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-02T00:00:00.000Z',
    ...over,
  };
}

describe('api-contract-validation ApiTaskRow', () => {
  it('accepts a fully valid row', () => {
    expect(() => assertApiTaskRowContract(validTask())).not.toThrow();
  });

  it('accepts null taskDate and null categoryId', () => {
    expect(() =>
      assertApiTaskRowContract(
        validTask({
          taskDate: null,
          categoryId: null,
          recurrence: null,
          pinned: false,
        }),
      ),
    ).not.toThrow();
  });

  it('rejects non-JSON contentJson', () => {
    expect(() => assertApiTaskRowContract(validTask({contentJson: '{broken'}))).toThrow();
  });

  it('rejects empty contentJson string', () => {
    expect(() => assertApiTaskRowContract(validTask({contentJson: ''}))).toThrow();
  });

  it('rejects checklistCompleted above checklistTotal', () => {
    expect(() =>
      assertApiTaskRowContract(validTask({checklistTotal: 1, checklistCompleted: 3})),
    ).toThrow();
  });

  it('rejects invalid task id (not UUID)', () => {
    expect(() => assertApiTaskRowContract(validTask({id: 'x'}))).toThrow();
  });

  it('rejects invalid taskDate format', () => {
    expect(() => assertApiTaskRowContract(validTask({taskDate: '15-01-2025'}))).toThrow();
  });

  it('rejects invalid status literal', () => {
    const row = {...validTask(), status: 'archived'};
    expect(() => assertApiTaskRowContract(row as unknown)).toThrow();
  });

  it('rejects strict-mode extra keys', () => {
    const row = {...validTask(), extraField: 1};
    expect(() => assertApiTaskRowContract(row as unknown)).toThrow();
  });
});

describe('api-contract-validation ApiCategoryRow', () => {
  function validCategory(over: Record<string, unknown> = {}) {
    return {
      id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      name: 'Inbox',
      icon: 'inbox',
      sortIndex: 2,
      createdAt: '2025-01-01T00:00:00.000Z',
      ...over,
    };
  }

  it('accepts a valid row', () => {
    expect(() => assertApiCategoryRowContract(validCategory())).not.toThrow();
  });

  it('rejects whitespace-only name', () => {
    expect(() => assertApiCategoryRowContract(validCategory({name: ' \t '}))).toThrow();
  });

  it('rejects icon not matching slug pattern', () => {
    expect(() => assertApiCategoryRowContract(validCategory({icon: 'FolderOpen'}))).toThrow();
  });

  it('rejects negative sortIndex', () => {
    expect(() => assertApiCategoryRowContract(validCategory({sortIndex: -1}))).toThrow();
  });

  it('rejects strict-mode extra keys', () => {
    const row = {...validCategory(), foo: 'bar'};
    expect(() => assertApiCategoryRowContract(row as unknown)).toThrow();
  });
});
