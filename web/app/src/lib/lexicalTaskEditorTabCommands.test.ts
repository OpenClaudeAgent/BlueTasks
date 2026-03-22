/** @vitest-environment jsdom */
import {setImmediate as setImmediatePromise} from 'node:timers/promises';
import {describe, expect, it, vi} from 'vitest';
import {
  $createParagraphNode,
  $createRangeSelection,
  $createTextNode,
  $getRoot,
  $getSelection,
  $setSelection,
  createEditor,
  INSERT_TAB_COMMAND,
  KEY_TAB_COMMAND,
  ParagraphNode,
  TextNode,
} from 'lexical';
import {CodeNode, $createCodeNode} from '@lexical/code';
import {
  $createListItemNode,
  $createListNode,
  $isListNode,
  ListItemNode,
  ListNode,
  registerCheckList,
  registerList,
} from '@lexical/list';
import {HeadingNode, $createHeadingNode} from '@lexical/rich-text';
import {
  $shouldForceLiteralTabForMarkdownShortcuts,
  registerTaskEditorTabCommands,
} from './lexicalTaskEditorTabCommands';

function tabKeyEvent(): KeyboardEvent {
  return {preventDefault: vi.fn(), shiftKey: false} as unknown as KeyboardEvent;
}

describe('registerTaskEditorTabCommands', () => {
  it('Given second checklist row When KEY_TAB Then inserts literal tab (no TabIndentation nest)', async () => {
    const onError = vi.fn();
    const editor = createEditor({
      namespace: 'task-tab-key-check',
      nodes: [ParagraphNode, TextNode, ListNode, ListItemNode],
      onError,
    });
    registerList(editor);
    registerCheckList(editor);
    registerTaskEditorTabCommands(editor);

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const list = $createListNode('check');
      const parentItem = $createListItemNode(false);
      const childItem = $createListItemNode(false);
      parentItem.append($createTextNode('Parent'));
      childItem.append($createTextNode(''));
      list.append(parentItem, childItem);
      root.append(list);
      const t = childItem.getFirstChild();
      if (t !== null) {
        t.select(0, 0);
      }
      const handled = editor.dispatchCommand(KEY_TAB_COMMAND, tabKeyEvent());
      expect(handled).toBe(true);
    });

    await setImmediatePromise();
    expect(onError).not.toHaveBeenCalled();

    editor.getEditorState().read(() => {
      const topList = $getRoot().getFirstChildOrThrow();
      expect($isListNode(topList)).toBe(true);
      expect(topList.getChildrenSize()).toBe(2);
      const secondLi = topList.getChildAtIndex(1);
      expect(secondLi).not.toBeNull();
      expect(secondLi!.getTextContent()).toContain('\t');
      for (const child of secondLi!.getChildren()) {
        expect($isListNode(child)).toBe(false);
      }
    });
  });

  it('Given plain paragraph When KEY_TAB Then inserts a literal tab in text', async () => {
    const editor = createEditor({
      namespace: 'task-tab-key-paragraph',
      nodes: [ParagraphNode, TextNode, ListNode, ListItemNode],
      onError: vi.fn(),
    });
    registerList(editor);
    registerCheckList(editor);
    registerTaskEditorTabCommands(editor);

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const p = $createParagraphNode();
      const t = $createTextNode('ab');
      p.append(t);
      root.append(p);
      t.select(1, 1);
      expect(editor.dispatchCommand(KEY_TAB_COMMAND, tabKeyEvent())).toBe(true);
    });

    await setImmediatePromise();

    editor.getEditorState().read(() => {
      const p = $getRoot().getFirstChildOrThrow();
      expect(p.getTextContent()).toContain('\t');
    });
  });

  it('Given second checklist row When INSERT_TAB on TextNode Then inserts literal tab (no nesting)', async () => {
    const editor = createEditor({
      namespace: 'task-tab-insert-check',
      nodes: [ParagraphNode, TextNode, ListNode, ListItemNode],
      onError: vi.fn(),
    });
    registerList(editor);
    registerCheckList(editor);
    registerTaskEditorTabCommands(editor);

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const list = $createListNode('check');
      const parentItem = $createListItemNode(false);
      const childItem = $createListItemNode(false);
      parentItem.append($createTextNode('P'));
      childItem.append($createTextNode(''));
      list.append(parentItem, childItem);
      root.append(list);
      childItem.getFirstChild()?.select(0, 0);
      expect(editor.dispatchCommand(INSERT_TAB_COMMAND, undefined)).toBe(true);
    });

    await setImmediatePromise();

    editor.getEditorState().read(() => {
      const secondLi = ($getRoot().getFirstChildOrThrow() as ListNode).getChildAtIndex(1);
      expect(secondLi?.getTextContent()).toBe('\t');
      expect($isListNode(secondLi?.getFirstChild())).toBe(false);
    });
  });

  it('Given empty checklist row with element selection When KEY_TAB Then returns false (no nesting)', async () => {
    const editor = createEditor({
      namespace: 'task-tab-key-element',
      nodes: [ParagraphNode, TextNode, ListNode, ListItemNode],
      onError: vi.fn(),
    });
    registerList(editor);
    registerCheckList(editor);
    registerTaskEditorTabCommands(editor);

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const list = $createListNode('check');
      const a = $createListItemNode(false);
      const b = $createListItemNode(false);
      a.append($createTextNode('A'));
      list.append(a, b);
      root.append(list);
      const range = $createRangeSelection();
      range.anchor.set(b.getKey(), 0, 'element');
      range.focus.set(b.getKey(), 0, 'element');
      $setSelection(range);
      expect(editor.dispatchCommand(KEY_TAB_COMMAND, tabKeyEvent())).toBe(false);
    });

    await setImmediatePromise();

    editor.getEditorState().read(() => {
      const secondLi = ($getRoot().getFirstChildOrThrow() as ListNode).getChildAtIndex(1);
      expect(secondLi?.getChildrenSize()).toBe(0);
    });
  });

  it('Given Shift+Tab When KEY_TAB Then returns false (outdent left to TabIndentation)', () => {
    const editor = createEditor({
      namespace: 'task-tab-shift',
      nodes: [ParagraphNode, TextNode, ListNode, ListItemNode],
      onError: vi.fn(),
    });
    registerTaskEditorTabCommands(editor);

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const p = $createParagraphNode();
      const t = $createTextNode('x');
      p.append(t);
      root.append(p);
      t.select(0, 0);
      const ev = {preventDefault: vi.fn(), shiftKey: true} as unknown as KeyboardEvent;
      expect(editor.dispatchCommand(KEY_TAB_COMMAND, ev)).toBe(false);
    });
  });

  it('Given caret inside code block When KEY_TAB Then returns false', () => {
    const editor = createEditor({
      namespace: 'task-tab-code',
      nodes: [ParagraphNode, TextNode, CodeNode, ListNode, ListItemNode],
      onError: vi.fn(),
    });
    registerTaskEditorTabCommands(editor);

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const code = $createCodeNode();
      const t = $createTextNode('a');
      code.append(t);
      root.append(code);
      t.select(1, 1);
      expect(editor.dispatchCommand(KEY_TAB_COMMAND, tabKeyEvent())).toBe(false);
    });
  });

  it('Given expanded range When KEY_TAB Then returns false', () => {
    const editor = createEditor({
      namespace: 'task-tab-range',
      nodes: [ParagraphNode, TextNode, ListNode, ListItemNode],
      onError: vi.fn(),
    });
    registerTaskEditorTabCommands(editor);

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const p = $createParagraphNode();
      const t = $createTextNode('ab');
      p.append(t);
      root.append(p);
      t.select(0, 2);
      expect(editor.dispatchCommand(KEY_TAB_COMMAND, tabKeyEvent())).toBe(false);
    });
  });

  it('Given bullet list item element selection When INSERT_TAB Then returns false (no checklist indent)', () => {
    const editor = createEditor({
      namespace: 'task-tab-insert-bullet-li',
      nodes: [ParagraphNode, TextNode, ListNode, ListItemNode],
      onError: vi.fn(),
    });
    registerList(editor);
    registerCheckList(editor);
    registerTaskEditorTabCommands(editor);

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const list = $createListNode('bullet');
      const item = $createListItemNode();
      list.append(item);
      root.append(list);
      const range = $createRangeSelection();
      range.anchor.set(item.getKey(), 0, 'element');
      range.focus.set(item.getKey(), 0, 'element');
      $setSelection(range);
      expect(editor.dispatchCommand(INSERT_TAB_COMMAND, undefined)).toBe(false);
    });
  });

  it('Given empty top-level paragraph element selection When INSERT_TAB Then inserts tab', async () => {
    const editor = createEditor({
      namespace: 'task-tab-insert-element-p',
      nodes: [ParagraphNode, TextNode, ListNode, ListItemNode],
      onError: vi.fn(),
    });
    registerTaskEditorTabCommands(editor);

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const p = $createParagraphNode();
      root.append(p);
      const range = $createRangeSelection();
      range.anchor.set(p.getKey(), 0, 'element');
      range.focus.set(p.getKey(), 0, 'element');
      $setSelection(range);
      expect(editor.dispatchCommand(INSERT_TAB_COMMAND, undefined)).toBe(true);
    });

    await setImmediatePromise();

    editor.getEditorState().read(() => {
      expect($getRoot().getFirstChildOrThrow().getTextContent()).toContain('\t');
    });
  });

  it('Given plain paragraph When INSERT_TAB on TextNode Then inserts tab without KEY_TAB', async () => {
    const editor = createEditor({
      namespace: 'task-tab-insert-text',
      nodes: [ParagraphNode, TextNode, ListNode, ListItemNode],
      onError: vi.fn(),
    });
    registerTaskEditorTabCommands(editor);

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const p = $createParagraphNode();
      const t = $createTextNode('z');
      p.append(t);
      root.append(p);
      t.select(1, 1);
      expect(editor.dispatchCommand(INSERT_TAB_COMMAND, undefined)).toBe(true);
    });

    await setImmediatePromise();

    editor.getEditorState().read(() => {
      expect($getRoot().getFirstChildOrThrow().getTextContent()).toContain('\t');
    });
  });
});

describe('$shouldForceLiteralTabForMarkdownShortcuts', () => {
  it('returns false when caret is inside a list item', () => {
    const editor = createEditor({
      namespace: 'task-tab-shouldforce-list',
      nodes: [ParagraphNode, TextNode, ListNode, ListItemNode],
      onError: vi.fn(),
    });
    registerList(editor);
    registerCheckList(editor);

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const list = $createListNode('check');
      const item = $createListItemNode(false);
      const text = $createTextNode('x');
      item.append(text);
      list.append(item);
      root.append(list);
      text.select(0, 0);
      expect($shouldForceLiteralTabForMarkdownShortcuts($getSelection())).toBe(false);
    });
  });

  it('returns true for a top-level paragraph', () => {
    const editor = createEditor({
      namespace: 'task-tab-shouldforce-p',
      nodes: [ParagraphNode, TextNode, ListNode, ListItemNode],
      onError: vi.fn(),
    });

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const p = $createParagraphNode();
      const t = $createTextNode('hi');
      p.append(t);
      root.append(p);
      t.select(1, 1);
      expect($shouldForceLiteralTabForMarkdownShortcuts($getSelection())).toBe(true);
    });
  });

  it('returns true for a top-level heading', () => {
    const editor = createEditor({
      namespace: 'task-tab-shouldforce-h',
      nodes: [ParagraphNode, TextNode, HeadingNode, ListNode, ListItemNode],
      onError: vi.fn(),
    });

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const h = $createHeadingNode('h1');
      const t = $createTextNode('T');
      h.append(t);
      root.append(h);
      t.select(1, 1);
      expect($shouldForceLiteralTabForMarkdownShortcuts($getSelection())).toBe(true);
    });
  });

  it('returns false when selection is not collapsed', () => {
    const editor = createEditor({
      namespace: 'task-tab-shouldforce-range',
      nodes: [ParagraphNode, TextNode, ListNode, ListItemNode],
      onError: vi.fn(),
    });

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const p = $createParagraphNode();
      const t = $createTextNode('ab');
      p.append(t);
      root.append(p);
      t.select(0, 2);
      expect($shouldForceLiteralTabForMarkdownShortcuts($getSelection())).toBe(false);
    });
  });
});
