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
});
