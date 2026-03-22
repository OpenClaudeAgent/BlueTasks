/** @vitest-environment jsdom */
import {setImmediate as setImmediatePromise} from 'node:timers/promises';
import {describe, expect, it, vi} from 'vitest';
import {
  $createRangeSelection,
  $createTextNode,
  $getRoot,
  $getSelection,
  $setSelection,
  createEditor,
  INSERT_PARAGRAPH_COMMAND,
  ParagraphNode,
  TextNode,
} from 'lexical';
import {
  $createListItemNode,
  $createListNode,
  $isListNode,
  ListItemNode,
  ListNode,
  registerCheckList,
  registerList,
} from '@lexical/list';
import {registerChecklistEmptyEnterNewItem} from './lexicalChecklistEmptyEnterNewItem';

describe('registerChecklistEmptyEnterNewItem', () => {
  it('Given empty checklist row When INSERT_PARAGRAPH Then inserts a second checkbox item in the same list', async () => {
    const onError = vi.fn();
    const editor = createEditor({
      namespace: 'test-check-empty-enter',
      nodes: [ParagraphNode, TextNode, ListNode, ListItemNode],
      onError,
    });
    registerList(editor);
    registerCheckList(editor);
    const unregister = registerChecklistEmptyEnterNewItem(editor);

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const list = $createListNode('check');
      const item = $createListItemNode(false);
      const text = $createTextNode('');
      item.append(text);
      list.append(item);
      root.append(list);
      text.select(0, 0);
    });

    const handled = editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined);
    expect(handled).toBe(true);
    await setImmediatePromise();
    expect(onError).not.toHaveBeenCalled();

    editor.getEditorState().read(() => {
      const root = $getRoot();
      const list = root.getFirstChildOrThrow();
      expect($isListNode(list)).toBe(true);
      const checkList = list as ListNode;
      expect(checkList.getListType()).toBe('check');
      expect(checkList.getChildrenSize()).toBe(2);
    });

    unregister();
  });

  it('Given bullet list When empty item Then checklist handler leaves list plugin to handle paragraph', async () => {
    const editor = createEditor({
      namespace: 'test-check-empty-enter-bullet',
      nodes: [ParagraphNode, TextNode, ListNode, ListItemNode],
      onError: vi.fn(),
    });
    registerList(editor);
    registerCheckList(editor);
    registerChecklistEmptyEnterNewItem(editor);

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const list = $createListNode('bullet');
      const item = $createListItemNode();
      const text = $createTextNode('');
      item.append(text);
      list.append(item);
      root.append(list);
      text.select(0, 0);
    });

    const handled = editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined);
    expect(handled).toBe(true);
    await setImmediatePromise();

    editor.getEditorState().read(() => {
      const root = $getRoot();
      const first = root.getFirstChildOrThrow();
      expect($isListNode(first)).toBe(false);
      expect(first.getType()).toBe('paragraph');
    });
  });

  it('Given expanded range in checklist When INSERT_PARAGRAPH Then returns false', async () => {
    const editor = createEditor({
      namespace: 'test-check-empty-enter-range',
      nodes: [ParagraphNode, TextNode, ListNode, ListItemNode],
      onError: vi.fn(),
    });
    registerList(editor);
    registerCheckList(editor);
    registerChecklistEmptyEnterNewItem(editor);

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const list = $createListNode('check');
      const item = $createListItemNode(false);
      const text = $createTextNode('ab');
      item.append(text);
      list.append(item);
      root.append(list);
      text.select(0, 2);
      expect($getSelection()?.isCollapsed()).toBe(false);
    });

    const handled = editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined);
    expect(handled).toBe(false);
    await setImmediatePromise();
  });

  it('Given empty listitem with element selection When INSERT_PARAGRAPH Then adds a sibling row', async () => {
    const editor = createEditor({
      namespace: 'test-check-empty-enter-element',
      nodes: [ParagraphNode, TextNode, ListNode, ListItemNode],
      onError: vi.fn(),
    });
    registerList(editor);
    registerCheckList(editor);
    registerChecklistEmptyEnterNewItem(editor);

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const list = $createListNode('check');
      const item = $createListItemNode(false);
      list.append(item);
      root.append(list);
      const sel = $createRangeSelection();
      sel.anchor.set(item.getKey(), 0, 'element');
      sel.focus.set(item.getKey(), 0, 'element');
      $setSelection(sel);
    });

    const handled = editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined);
    expect(handled).toBe(true);
    await setImmediatePromise();

    editor.getEditorState().read(() => {
      const list = $getRoot().getFirstChildOrThrow() as ListNode;
      expect($isListNode(list)).toBe(true);
      expect((list as ListNode).getChildrenSize()).toBe(2);
    });
  });

  it('Given checklist row with non-empty text When INSERT_PARAGRAPH Then checklist handler returns false', async () => {
    const editor = createEditor({
      namespace: 'test-check-empty-enter-text',
      nodes: [ParagraphNode, TextNode, ListNode, ListItemNode],
      onError: vi.fn(),
    });
    registerList(editor);
    registerCheckList(editor);
    registerChecklistEmptyEnterNewItem(editor);

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const list = $createListNode('check');
      const item = $createListItemNode(false);
      const text = $createTextNode('body');
      item.append(text);
      list.append(item);
      root.append(list);
      text.select(4, 4);
    });

    const handled = editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined);
    expect(handled).toBe(false);
    await setImmediatePromise();
  });
});
