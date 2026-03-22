/** @vitest-environment jsdom */
import {setImmediate as setImmediatePromise} from 'node:timers/promises';
import {describe, expect, it, vi} from 'vitest';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
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
import {registerCheckListRichEmptyParagraphExit} from './lexicalCheckListRichEmptyParagraphExit';

describe('registerCheckListRichEmptyParagraphExit', () => {
  it('Given checklist row ListItem > Paragraph > empty When INSERT_PARAGRAPH Then exits to paragraph', async () => {
    const onError = vi.fn();
    const editor = createEditor({
      namespace: 'test-check-rich-exit',
      nodes: [ParagraphNode, TextNode, ListNode, ListItemNode],
      onError,
    });
    registerList(editor);
    registerCheckList(editor);
    registerCheckListRichEmptyParagraphExit(editor);

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const list = $createListNode('check');
      const item = $createListItemNode(false);
      const p = $createParagraphNode();
      const text = $createTextNode('');
      p.append(text);
      item.append(p);
      list.append(item);
      root.append(list);
      text.select(0, 0);
    });

    const handled = editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined);
    expect(handled).toBe(true);
    await setImmediatePromise();
    expect(onError).not.toHaveBeenCalled();

    editor.getEditorState().read(() => {
      const first = $getRoot().getFirstChildOrThrow();
      expect($isListNode(first)).toBe(false);
      expect(first.getType()).toBe('paragraph');
    });
  });

  it('Given checklist row with non-empty paragraph When INSERT_PARAGRAPH Then returns false (default list split)', () => {
    const editor = createEditor({
      namespace: 'test-check-rich-exit-nonempty',
      nodes: [ParagraphNode, TextNode, ListNode, ListItemNode],
      onError: vi.fn(),
    });
    registerList(editor);
    registerCheckList(editor);
    registerCheckListRichEmptyParagraphExit(editor);

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const list = $createListNode('check');
      const item = $createListItemNode(false);
      const p = $createParagraphNode();
      const text = $createTextNode('hello');
      p.append(text);
      item.append(p);
      list.append(item);
      root.append(list);
      text.select(5, 5);
      expect(editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined)).toBe(false);
    });
  });

  it('Given expanded selection in checklist When INSERT_PARAGRAPH Then returns false', () => {
    const editor = createEditor({
      namespace: 'test-check-rich-exit-range',
      nodes: [ParagraphNode, TextNode, ListNode, ListItemNode],
      onError: vi.fn(),
    });
    registerList(editor);
    registerCheckList(editor);
    registerCheckListRichEmptyParagraphExit(editor);

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const list = $createListNode('check');
      const item = $createListItemNode(false);
      const p = $createParagraphNode();
      const text = $createTextNode('ab');
      p.append(text);
      item.append(p);
      list.append(item);
      root.append(list);
      text.select(0, 2);
      expect(editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined)).toBe(false);
    });
  });

  it('Given bullet row with empty text node (no Paragraph wrapper) When INSERT_PARAGRAPH Then ListPlugin exits and root is not empty', async () => {
    const onError = vi.fn();
    const editor = createEditor({
      namespace: 'test-check-rich-exit-bullet',
      nodes: [ParagraphNode, TextNode, ListNode, ListItemNode],
      onError,
    });
    registerList(editor);
    registerCheckList(editor);
    registerCheckListRichEmptyParagraphExit(editor);

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

    let handled = false;
    editor.update(() => {
      handled = editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined) === true;
    });
    await setImmediatePromise();
    expect(onError).not.toHaveBeenCalled();
    expect(handled).toBe(true);

    editor.getEditorState().read(() => {
      expect($getRoot().getChildrenSize()).toBeGreaterThan(0);
      const first = $getRoot().getFirstChildOrThrow();
      expect($isListNode(first)).toBe(false);
      expect(first.getType()).toBe('paragraph');
    });
  });
});
