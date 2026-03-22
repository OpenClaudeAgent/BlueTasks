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
import {registerMarkdownShortcuts} from '@lexical/markdown';
import {
  $isListNode,
  ListItemNode,
  ListNode,
  registerCheckList,
  registerList,
} from '@lexical/list';
import {CHECK_LIST_FLAT_TABS} from './lexicalMarkdownCheckListFlatTabs';

describe('CHECK_LIST_FLAT_TABS', () => {
  it('does not apply listItem indent from leading tab characters before [] ', async () => {
    const onError = vi.fn();
    const editor = createEditor({
      namespace: 'test-check-flat-tabs',
      nodes: [ParagraphNode, TextNode, ListNode, ListItemNode],
      onError,
    });
    registerList(editor);
    registerCheckList(editor);
    registerMarkdownShortcuts(editor, [CHECK_LIST_FLAT_TABS]);

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const p = $createParagraphNode();
      const text = $createTextNode('');
      p.append(text);
      root.append(p);
      text.select(0, 0);
    });

    for (const character of '\t\t\t[] ') {
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

    editor.getEditorState().read(() => {
      const list = $getRoot().getFirstChildOrThrow();
      expect($isListNode(list)).toBe(true);
      const item = (list as ListNode).getFirstChildOrThrow() as ListItemNode;
      expect(item.getIndent()).toBe(0);
    });
  });

  it('still toggles checked when [x] after tabs (no tab-based indent)', async () => {
    const editor = createEditor({
      namespace: 'test-check-flat-tabs-x',
      nodes: [ParagraphNode, TextNode, ListNode, ListItemNode],
      onError: vi.fn(),
    });
    registerList(editor);
    registerCheckList(editor);
    registerMarkdownShortcuts(editor, [CHECK_LIST_FLAT_TABS]);

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const p = $createParagraphNode();
      const text = $createTextNode('');
      p.append(text);
      root.append(p);
      text.select(0, 0);
    });

    for (const character of '\t[x] ') {
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

    editor.getEditorState().read(() => {
      const list = $getRoot().getFirstChildOrThrow() as ListNode;
      const item = list.getFirstChildOrThrow() as ListItemNode;
      expect(list.getListType()).toBe('check');
      expect(item.getChecked()).toBe(true);
      expect(item.getIndent()).toBe(0);
    });
  });
});
