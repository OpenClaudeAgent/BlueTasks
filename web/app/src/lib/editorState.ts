export type EditorChangePayload = {
  json: string;
  plainText: string;
  checklistTotal: number;
  checklistCompleted: number;
};

export function createEmptyEditorState(): string {
  return JSON.stringify({
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
}

export function summarizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function extractChecklistStats(editorStateJson: unknown): {
  checklistTotal: number;
  checklistCompleted: number;
} {
  let checklistTotal = 0;
  let checklistCompleted = 0;

  /**
   * On ne compte que les `listitem` dont le parent direct est une liste `listType: 'check'`.
   * Sinon les items sans clé `checked` (omise après sérialisation) n'étaient pas comptés,
   * et le % restait à 0 ou faux.
   */
  function visit(node: unknown, parent: Record<string, unknown> | null): void {
    if (!node || typeof node !== 'object') {
      return;
    }

    const record = node as Record<string, unknown>;
    const parentIsChecklist = parent?.type === 'list' && parent.listType === 'check';

    if (record.type === 'listitem' && parentIsChecklist) {
      checklistTotal += 1;
      if (record.checked === true) {
        checklistCompleted += 1;
      }
    }

    if (Array.isArray(record.children)) {
      record.children.forEach((child) => visit(child, record));
    }
  }

  const root =
    editorStateJson &&
    typeof editorStateJson === 'object' &&
    'root' in editorStateJson &&
    (editorStateJson as {root: unknown}).root
      ? (editorStateJson as {root: unknown}).root
      : editorStateJson;

  visit(root, null);
  return {checklistTotal, checklistCompleted};
}

/** True if two Lexical document JSON strings describe the same document (ignores key ordering / whitespace). */
export function lexicalDocsContentEqual(a: string, b: string): boolean {
  if (a === b) {
    return true;
  }
  try {
    return JSON.stringify(JSON.parse(a)) === JSON.stringify(JSON.parse(b));
  } catch {
    return false;
  }
}
