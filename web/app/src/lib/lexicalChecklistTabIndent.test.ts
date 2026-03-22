/** @vitest-environment jsdom */
import {setImmediate as setImmediatePromise} from 'node:timers/promises';
import {describe, expect, it, vi} from 'vitest';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  createEditor,
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
import {$tryIndentChecklistItemFromTab} from './lexicalChecklistTabIndent';

describe('checklist Tab indent', () => {
  it('nests the second list item under the first via setIndent (same update as selection)', async () => {
    const onError = vi.fn();
    const editor = createEditor({
      namespace: 'test-check-tab',
      nodes: [ListNode, ListItemNode],
      onError,
    });
    registerList(editor);
    registerCheckList(editor);

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
      expect($tryIndentChecklistItemFromTab()).toBe(true);
    });

    await setImmediatePromise();

    expect(onError).not.toHaveBeenCalled();

    editor.getEditorState().read(() => {
      const root = $getRoot();
      const topList = root.getFirstChildOrThrow();
      expect($isListNode(topList)).toBe(true);
      expect(topList.getChildrenSize()).toBe(2);
      const firstLi = topList.getChildAtIndex(0);
      const secondLi = topList.getChildAtIndex(1);
      expect(firstLi?.getType()).toBe('listitem');
      expect(secondLi?.getType()).toBe('listitem');
      const nested = secondLi?.getFirstChild();
      expect(nested).not.toBeNull();
      expect($isListNode(nested)).toBe(true);
      const nestedList = nested as ListNode;
      expect(nestedList.getListType()).toBe('check');
      expect(nestedList.getChildrenSize()).toBe(1);
      const nestedLi = nestedList.getFirstChild();
      expect(nestedLi?.getType()).toBe('listitem');
    });
  });

  it('returns false when the caret is not in a checklist list item', () => {
    const editor = createEditor({
      namespace: 'test-check-tab-plain',
      onError: vi.fn(),
    });

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const p = $createParagraphNode();
      const t = $createTextNode('x');
      p.append(t);
      root.append(p);
      t.select(1, 1);
      expect($tryIndentChecklistItemFromTab()).toBe(false);
    });
  });
});
