/** @vitest-environment jsdom */
import {setImmediate as setImmediatePromise} from 'node:timers/promises';
import {describe, expect, it, vi} from 'vitest';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  createEditor,
  ParagraphNode,
  TextNode,
} from 'lexical';
import {
  $createListItemNode,
  $createListNode,
  $isListItemNode,
  ListItemNode,
  ListNode,
  registerCheckList,
  registerList,
} from '@lexical/list';
import {registerCheckListTouchFix} from './lexicalCheckListTouchFix';

function stubLiRect(li: HTMLElement, opts: {left?: number; right?: number} = {}) {
  const left = opts.left ?? 0;
  const right = opts.right ?? 320;
  Object.defineProperty(li, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({
      left,
      right,
      top: 0,
      bottom: 24,
      width: right - left,
      height: 24,
      x: left,
      y: 0,
      toJSON: () => ({}),
    }),
  });
}

function dispatchClick(target: EventTarget, clientX: number, button = 0) {
  const ev = new MouseEvent('click', {bubbles: true, cancelable: true, clientX, button});
  target.dispatchEvent(ev);
  return ev.defaultPrevented;
}

describe('Feature: checklist touch / gutter hit target', () => {
  it('Scenario: tap in left gutter on checklist row When click Then toggles checked once', async () => {
    const onError = vi.fn();
    const editor = createEditor({
      namespace: 'touch-fix-toggle',
      nodes: [ParagraphNode, TextNode, ListNode, ListItemNode],
      onError,
    });
    registerList(editor);
    registerCheckList(editor);
    const unregister = registerCheckListTouchFix(editor);

    const rootEl = document.createElement('div');
    document.body.appendChild(rootEl);
    editor.setRootElement(rootEl);

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const list = $createListNode('check');
      const item = $createListItemNode(false);
      const p = $createParagraphNode();
      const text = $createTextNode('milk');
      p.append(text);
      item.append(p);
      list.append(item);
      root.append(list);
    });

    await setImmediatePromise();

    const li = rootEl.querySelector('li');
    expect(li).not.toBeNull();
    stubLiRect(li!);

    const textEl = li!.querySelector('span') ?? li!.firstElementChild;
    expect(textEl).not.toBeNull();

    dispatchClick(textEl!, 20, 0);

    await setImmediatePromise();
    expect(onError).not.toHaveBeenCalled();

    editor.getEditorState().read(() => {
      const list = $getRoot().getFirstChildOrThrow();
      const item = list.getFirstChildOrThrow();
      expect($isListItemNode(item)).toBe(true);
      expect(item.getChecked()).toBe(true);
    });

    unregister();
    editor.setRootElement(null);
    rootEl.remove();
  });

  it('Scenario: click outside checkbox strip When same row Then does not toggle', async () => {
    const editor = createEditor({
      namespace: 'touch-fix-miss',
      nodes: [ParagraphNode, TextNode, ListNode, ListItemNode],
      onError: vi.fn(),
    });
    registerList(editor);
    registerCheckList(editor);
    registerCheckListTouchFix(editor);

    const rootEl = document.createElement('div');
    document.body.appendChild(rootEl);
    editor.setRootElement(rootEl);

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const list = $createListNode('check');
      const item = $createListItemNode(false);
      const p = $createParagraphNode();
      p.append($createTextNode('x'));
      item.append(p);
      list.append(item);
      root.append(list);
    });

    await setImmediatePromise();
    const li = rootEl.querySelector('li')!;
    stubLiRect(li);
    const inner = li.querySelector('span') ?? li.firstElementChild!;
    dispatchClick(inner, 200, 0);

    editor.getEditorState().read(() => {
      const item = $getRoot().getFirstChildOrThrow().getFirstChildOrThrow();
      expect($isListItemNode(item)).toBe(true);
      expect(item.getChecked()).toBe(false);
    });

    editor.setRootElement(null);
    rootEl.remove();
  });

  it('Scenario: event target is a Text node When gutter click Then resolves parent and toggles', async () => {
    const editor = createEditor({
      namespace: 'touch-fix-text-target',
      nodes: [ParagraphNode, TextNode, ListNode, ListItemNode],
      onError: vi.fn(),
    });
    registerList(editor);
    registerCheckList(editor);
    registerCheckListTouchFix(editor);

    const rootEl = document.createElement('div');
    document.body.appendChild(rootEl);
    editor.setRootElement(rootEl);

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const list = $createListNode('check');
      const item = $createListItemNode(false);
      const p = $createParagraphNode();
      p.append($createTextNode('milk'));
      item.append(p);
      list.append(item);
      root.append(list);
    });

    await setImmediatePromise();
    const li = rootEl.querySelector('li')!;
    stubLiRect(li);
    const textNode = [...li.querySelectorAll('*')]
      .flatMap((el) => [...el.childNodes])
      .find((n) => n.nodeType === Node.TEXT_NODE && n.textContent === 'milk');
    expect(textNode).toBeDefined();
    dispatchClick(textNode!, 20, 0);

    await setImmediatePromise();
    editor.getEditorState().read(() => {
      const item = $getRoot().getFirstChildOrThrow().getFirstChildOrThrow();
      expect(item.getChecked()).toBe(true);
    });

    editor.setRootElement(null);
    rootEl.remove();
  });

  it('Scenario: click event without pointer coordinates When dispatched Then checklist unchanged', async () => {
    const editor = createEditor({
      namespace: 'touch-fix-no-xy',
      nodes: [ParagraphNode, TextNode, ListNode, ListItemNode],
      onError: vi.fn(),
    });
    registerList(editor);
    registerCheckList(editor);
    registerCheckListTouchFix(editor);

    const rootEl = document.createElement('div');
    document.body.appendChild(rootEl);
    editor.setRootElement(rootEl);

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const list = $createListNode('check');
      const item = $createListItemNode(false);
      const p = $createParagraphNode();
      p.append($createTextNode('x'));
      item.append(p);
      list.append(item);
      root.append(list);
    });

    await setImmediatePromise();
    const li = rootEl.querySelector('li')!;
    stubLiRect(li);
    const inner = li.querySelector('span') ?? li.firstElementChild!;
    inner.dispatchEvent(new Event('click', {bubbles: true, cancelable: true}));

    editor.getEditorState().read(() => {
      const item = $getRoot().getFirstChildOrThrow().getFirstChildOrThrow();
      expect(item.getChecked()).toBe(false);
    });

    editor.setRootElement(null);
    rootEl.remove();
  });

  it('Scenario: nested sublist as first child When gutter click Then ignores (no toggle)', async () => {
    const editor = createEditor({
      namespace: 'touch-fix-nested',
      nodes: [ParagraphNode, TextNode, ListNode, ListItemNode],
      onError: vi.fn(),
    });
    registerList(editor);
    registerCheckList(editor);
    registerCheckListTouchFix(editor);

    const rootEl = document.createElement('div');
    document.body.appendChild(rootEl);
    editor.setRootElement(rootEl);

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const outerList = $createListNode('check');
      const outerItem = $createListItemNode(false);
      const subList = $createListNode('bullet');
      const subItem = $createListItemNode();
      const p = $createParagraphNode();
      p.append($createTextNode('inner'));
      subItem.append(p);
      subList.append(subItem);
      outerItem.append(subList);
      outerItem.append($createParagraphNode().append($createTextNode('tail')));
      outerList.append(outerItem);
      root.append(outerList);
    });

    await setImmediatePromise();
    const items = rootEl.querySelectorAll('li');
    const outerLi = items[0]!;
    stubLiRect(outerLi);
    const target = outerLi.querySelector('span') ?? outerLi;
    dispatchClick(target, 15, 0);

    editor.getEditorState().read(() => {
      const outerItem = $getRoot().getFirstChildOrThrow().getFirstChildOrThrow();
      expect($isListItemNode(outerItem)).toBe(true);
      expect(outerItem.getChecked()).toBe(false);
    });

    editor.setRootElement(null);
    rootEl.remove();
  });

  it('Scenario: editor not editable When gutter click Then no toggle', async () => {
    const editor = createEditor({
      namespace: 'touch-fix-readonly',
      nodes: [ParagraphNode, TextNode, ListNode, ListItemNode],
      onError: vi.fn(),
    });
    registerList(editor);
    registerCheckList(editor);
    registerCheckListTouchFix(editor);

    const rootEl = document.createElement('div');
    document.body.appendChild(rootEl);
    editor.setRootElement(rootEl);
    editor.setEditable(false);

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const list = $createListNode('check');
      const item = $createListItemNode(false);
      const p = $createParagraphNode();
      p.append($createTextNode('ro'));
      item.append(p);
      list.append(item);
      root.append(list);
    });

    await setImmediatePromise();
    const li = rootEl.querySelector('li')!;
    stubLiRect(li);
    const inner = li.querySelector('span') ?? li.firstElementChild!;
    dispatchClick(inner, 12, 0);

    editor.getEditorState().read(() => {
      const item = $getRoot().getFirstChildOrThrow().getFirstChildOrThrow();
      expect(item.getChecked()).toBe(false);
    });

    editor.setRootElement(null);
    rootEl.remove();
  });

  it('Scenario: second gutter tap within dedupe window When click Then stays checked (no double-toggle)', async () => {
    const editor = createEditor({
      namespace: 'touch-fix-dedupe',
      nodes: [ParagraphNode, TextNode, ListNode, ListItemNode],
      onError: vi.fn(),
    });
    registerList(editor);
    registerCheckList(editor);
    registerCheckListTouchFix(editor);

    const rootEl = document.createElement('div');
    document.body.appendChild(rootEl);
    editor.setRootElement(rootEl);

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const list = $createListNode('check');
      const item = $createListItemNode(false);
      const p = $createParagraphNode();
      p.append($createTextNode('d'));
      item.append(p);
      list.append(item);
      root.append(list);
    });

    await setImmediatePromise();
    const li = rootEl.querySelector('li')!;
    stubLiRect(li);
    const inner = li.querySelector('span') ?? li.firstElementChild!;

    dispatchClick(inner, 18, 0);
    await new Promise((r) => setTimeout(r, 5));
    dispatchClick(inner, 19, 0);
    await setImmediatePromise();

    editor.getEditorState().read(() => {
      const item = $getRoot().getFirstChildOrThrow().getFirstChildOrThrow();
      expect(item.getChecked()).toBe(true);
    });

    editor.setRootElement(null);
    rootEl.remove();
  });

  it('Scenario: non-primary mouse button When click Then ignored', async () => {
    const editor = createEditor({
      namespace: 'touch-fix-button',
      nodes: [ParagraphNode, TextNode, ListNode, ListItemNode],
      onError: vi.fn(),
    });
    registerList(editor);
    registerCheckList(editor);
    registerCheckListTouchFix(editor);

    const rootEl = document.createElement('div');
    document.body.appendChild(rootEl);
    editor.setRootElement(rootEl);

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const list = $createListNode('check');
      const item = $createListItemNode(false);
      const p = $createParagraphNode();
      p.append($createTextNode('mb'));
      item.append(p);
      list.append(item);
      root.append(list);
    });

    await setImmediatePromise();
    const li = rootEl.querySelector('li')!;
    stubLiRect(li);
    const inner = li.querySelector('span') ?? li.firstElementChild!;
    dispatchClick(inner, 10, 1);

    editor.getEditorState().read(() => {
      const item = $getRoot().getFirstChildOrThrow().getFirstChildOrThrow();
      expect(item.getChecked()).toBe(false);
    });

    editor.setRootElement(null);
    rootEl.remove();
  });
});
