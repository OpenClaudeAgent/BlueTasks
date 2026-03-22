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
  INSERT_PARAGRAPH_COMMAND,
  ParagraphNode,
  TextNode,
} from 'lexical';
import {registerMarkdownShortcuts} from '@lexical/markdown';
import {CHECK_LIST_FLAT_TABS} from './lexicalMarkdownCheckListFlatTabs';
import {$isListNode, ListItemNode, ListNode, registerCheckList, registerList} from '@lexical/list';
import {registerCheckListAtomicCatchUp} from './lexicalCheckListAtomicCatchUp';

describe('registerCheckListAtomicCatchUp', () => {
  it('turns `[] ` into a check list when the trigger is inserted in a single update', async () => {
    const onError = vi.fn();
    const editor = createEditor({
      namespace: 'test-checklist-atomic',
      nodes: [ParagraphNode, TextNode, ListNode, ListItemNode],
      onError,
    });

    registerList(editor);
    registerCheckList(editor);
    registerMarkdownShortcuts(editor, [CHECK_LIST_FLAT_TABS]);
    registerCheckListAtomicCatchUp(editor);

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const paragraph = $createParagraphNode();
      const text = $createTextNode('[] ');
      paragraph.append(text);
      root.append(paragraph);
      text.select(3, 3);
    });

    await setImmediatePromise();

    expect(onError).not.toHaveBeenCalled();

    editor.getEditorState().read(() => {
      const root = $getRoot();
      const first = root.getFirstChild();
      expect(first).not.toBeNull();
      expect($isListNode(first)).toBe(true);
      expect((first as ListNode).getListType()).toBe('check');
    });
  });

  it('still works when `[] ` is typed one character per update (Lexical markdown + catch-up)', async () => {
    const onError = vi.fn();
    const editor = createEditor({
      namespace: 'test-checklist-atomic-char',
      nodes: [ParagraphNode, TextNode, ListNode, ListItemNode],
      onError,
    });

    registerList(editor);
    registerCheckList(editor);
    registerMarkdownShortcuts(editor, [CHECK_LIST_FLAT_TABS]);
    registerCheckListAtomicCatchUp(editor);

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
        {discrete: true},
      );
      await setImmediatePromise();
    }

    expect(onError).not.toHaveBeenCalled();

    editor.getEditorState().read(() => {
      const root = $getRoot();
      const first = root.getFirstChild();
      expect($isListNode(first)).toBe(true);
    });
  });

  it('after `[] ` and Enter on empty checklist row, discrete `[] ` still becomes a checklist (new list)', async () => {
    const onError = vi.fn();
    const editor = createEditor({
      namespace: 'test-checklist-atomic-enter',
      nodes: [ParagraphNode, TextNode, ListNode, ListItemNode],
      onError,
    });

    registerList(editor);
    registerCheckList(editor);
    registerMarkdownShortcuts(editor, [CHECK_LIST_FLAT_TABS]);
    registerCheckListAtomicCatchUp(editor);

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
        {discrete: true},
      );
      await setImmediatePromise();
    }

    expect(onError).not.toHaveBeenCalled();

    editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined);
    await setImmediatePromise();

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

    expect(onError).not.toHaveBeenCalled();

    editor.getEditorState().read(() => {
      const root = $getRoot();
      const list = root.getFirstChild();
      expect($isListNode(list)).toBe(true);
      const checkList = list as ListNode;
      expect(checkList.getListType()).toBe('check');
      expect(checkList.getChildrenSize()).toBe(1);
    });
  });
});
