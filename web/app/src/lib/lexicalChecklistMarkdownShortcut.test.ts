/** @vitest-environment jsdom */
import {setImmediate as setImmediatePromise} from 'node:timers/promises';
import {describe, expect, it, vi} from 'vitest';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  createEditor,
  ParagraphNode,
  TextNode,
} from 'lexical';
import {CHECK_LIST, registerMarkdownShortcuts} from '@lexical/markdown';
import {$isListNode, ListItemNode, ListNode, registerCheckList, registerList} from '@lexical/list';

/**
 * Regression guard: `[] ` must become a checklist (same rule as LexicalTaskEditor + MarkdownShortcutPlugin).
 * Headless editor + one-char updates mirror how the shortcut listener sees typing.
 */
describe('Checklist markdown shortcut `[] `', () => {
  it('turns a plain paragraph into a check list after typing space', async () => {
    const onError = vi.fn();
    const editor = createEditor({
      namespace: 'test-md-checklist',
      nodes: [ParagraphNode, TextNode, ListNode, ListItemNode],
      onError,
    });

    registerList(editor);
    registerCheckList(editor);
    registerMarkdownShortcuts(editor, [CHECK_LIST]);

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const paragraph = $createParagraphNode();
      const text = $createTextNode('');
      paragraph.append(text);
      root.append(paragraph);
      text.select(0, 0);
    });

    for (const character of '[] ') {
      editor.update(
        () => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            selection.insertText(character);
          }
        },
        { discrete: true },
      );
      await setImmediatePromise();
    }

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
