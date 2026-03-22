/** @vitest-environment jsdom */
import {setImmediate as setImmediatePromise} from 'node:timers/promises';
import {describe, expect, it, vi} from 'vitest';
import {
  $createParagraphNode,
  $createTabNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $isParagraphNode,
  createEditor,
  ParagraphNode,
  TextNode,
} from 'lexical';
import {CHECK_LIST, registerMarkdownShortcuts} from '@lexical/markdown';
import {$isListNode, ListItemNode, ListNode, registerCheckList, registerList} from '@lexical/list';
import {registerParagraphLeadingTabCoalesce} from './lexicalParagraphLeadingTabCoalesce';

async function typeChecklistTrigger(editor: ReturnType<typeof createEditor>) {
  for (const character of '[] ') {
    editor.update(
      () => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.insertText(character);
        }
      },
      {discrete: true},
    );
    await setImmediatePromise();
  }
}

function setupChecklistMarkdownEditor() {
  const onError = vi.fn();
  const editor = createEditor({
    namespace: 'test-tab-coalesce-md',
    nodes: [ParagraphNode, TextNode, ListNode, ListItemNode],
    onError,
  });
  registerList(editor);
  registerCheckList(editor);
  registerMarkdownShortcuts(editor, [CHECK_LIST]);
  return {editor, onError};
}

/**
 * TDD: leading TabNode breaks `[] ` markdown (caret text must be paragraph's first child).
 * Without coalescence → still a paragraph. With registerParagraphLeadingTabCoalesce → checklist.
 */
describe('registerParagraphLeadingTabCoalesce + checklist `[] `', () => {
  it('does not turn into a checklist when a TabNode precedes the text (no coalesce)', async () => {
    const {editor, onError} = setupChecklistMarkdownEditor();

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const paragraph = $createParagraphNode();
      const text = $createTextNode('');
      paragraph.append($createTabNode(), text);
      root.append(paragraph);
      text.select(0, 0);
    });

    await typeChecklistTrigger(editor);

    expect(onError).not.toHaveBeenCalled();

    editor.getEditorState().read(() => {
      const root = $getRoot();
      const first = root.getFirstChild();
      expect(first).not.toBeNull();
      expect($isParagraphNode(first)).toBe(true);
      expect($isListNode(first)).toBe(false);
    });
  });

  it('turns into a check list after typing space when coalesce is registered', async () => {
    const {editor, onError} = setupChecklistMarkdownEditor();
    const unregister = registerParagraphLeadingTabCoalesce(editor);

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const paragraph = $createParagraphNode();
      const text = $createTextNode('');
      paragraph.append($createTabNode(), text);
      root.append(paragraph);
      text.select(0, 0);
    });

    await typeChecklistTrigger(editor);
    unregister();

    expect(onError).not.toHaveBeenCalled();

    editor.getEditorState().read(() => {
      const root = $getRoot();
      const first = root.getFirstChild();
      expect(first).not.toBeNull();
      expect($isListNode(first)).toBe(true);
      expect((first as ListNode).getListType()).toBe('check');
    });
  });
});
