/** @vitest-environment jsdom */
import {setImmediate as setImmediatePromise} from 'node:timers/promises';
import {describe, expect, it, vi} from 'vitest';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  $isTextNode,
  createEditor,
  INSERT_PARAGRAPH_COMMAND,
  INSERT_TAB_COMMAND,
  ParagraphNode,
  TextNode,
} from 'lexical';
import {registerMarkdownShortcuts} from '@lexical/markdown';
import {$isListNode, ListItemNode, ListNode, registerCheckList, registerList} from '@lexical/list';
import {registerCheckListAtomicCatchUp} from './lexicalCheckListAtomicCatchUp';
import {registerCheckListRichEmptyParagraphExit} from './lexicalCheckListRichEmptyParagraphExit';
import {extractChecklistStats} from './editorState';
import {CHECK_LIST_FLAT_TABS} from './lexicalMarkdownCheckListFlatTabs';
import {registerTaskEditorTabCommands} from './lexicalTaskEditorTabCommands';

/**
 * Mirrors the checklist-related Lexical plugins mounted in LexicalTaskEditor.tsx
 * (sans React / TabIndentationPlugin).
 */
function registerTaskEditorChecklistStack(editor: ReturnType<typeof createEditor>): void {
  registerList(editor);
  registerCheckList(editor);
  registerMarkdownShortcuts(editor, [CHECK_LIST_FLAT_TABS]);
  registerCheckListAtomicCatchUp(editor);
  registerCheckListRichEmptyParagraphExit(editor);
  registerTaskEditorTabCommands(editor);
}

describe('LexicalTaskEditor checklist stack (integration)', () => {
  it('discrete \\t\\t[] then Enter on empty row: one checklist item then exit leaves zero checklist rows in stats', async () => {
    const onError = vi.fn();
    const editor = createEditor({
      namespace: 'task-editor-check-int-exit',
      nodes: [ParagraphNode, TextNode, ListNode, ListItemNode],
      onError,
    });
    registerTaskEditorChecklistStack(editor);

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const p = $createParagraphNode();
      const text = $createTextNode('');
      p.append(text);
      root.append(p);
      text.select(0, 0);
    });

    for (const character of '\t\t[] ') {
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

    expect(
      extractChecklistStats(JSON.parse(JSON.stringify(editor.getEditorState().toJSON()))),
    ).toEqual({checklistTotal: 1, checklistCompleted: 0});

    editor.update(() => {
      const list = $getRoot().getFirstChildOrThrow() as ListNode;
      const item = list.getFirstChildOrThrow() as ListItemNode;
      item.selectStart();
    });

    editor.update(() => {
      expect(editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined)).toBe(true);
    });
    await setImmediatePromise();
    expect(onError).not.toHaveBeenCalled();

    expect(
      extractChecklistStats(JSON.parse(JSON.stringify(editor.getEditorState().toJSON()))),
    ).toEqual({checklistTotal: 0, checklistCompleted: 0});
  });

  it('after \\t[] markdown, INSERT_TAB on row text keeps checklistTotal at 1 and inserts a tab', async () => {
    const onError = vi.fn();
    const editor = createEditor({
      namespace: 'task-editor-check-int-tab',
      nodes: [ParagraphNode, TextNode, ListNode, ListItemNode],
      onError,
    });
    registerTaskEditorChecklistStack(editor);

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const p = $createParagraphNode();
      const text = $createTextNode('');
      p.append(text);
      root.append(p);
      text.select(0, 0);
    });

    for (const character of '\t[] ') {
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

    expect(
      extractChecklistStats(JSON.parse(JSON.stringify(editor.getEditorState().toJSON()))),
    ).toEqual({checklistTotal: 1, checklistCompleted: 0});

    editor.update(() => {
      const list = $getRoot().getFirstChildOrThrow();
      if (!$isListNode(list)) {
        throw new Error('expected list');
      }
      const item = list.getFirstChildOrThrow() as ListItemNode;
      if (item.getChildrenSize() === 0) {
        const p = $createParagraphNode();
        p.append($createTextNode(''));
        item.append(p);
      }
      const block = item.getFirstChildOrThrow();
      let textNode: TextNode | null = null;
      if ($isTextNode(block)) {
        textNode = block;
      } else if ($isParagraphNode(block)) {
        if (block.getChildrenSize() === 0) {
          block.append($createTextNode(''));
        }
        const ch = block.getFirstChild();
        textNode = ch !== null && $isTextNode(ch) ? ch : null;
      }
      if (textNode === null) {
        throw new Error('expected a TextNode under checklist row');
      }
      textNode.select(0, 0);
      expect(editor.dispatchCommand(INSERT_TAB_COMMAND, undefined)).toBe(true);
    });
    await setImmediatePromise();
    expect(onError).not.toHaveBeenCalled();

    expect(
      extractChecklistStats(JSON.parse(JSON.stringify(editor.getEditorState().toJSON()))),
    ).toEqual({checklistTotal: 1, checklistCompleted: 0});

    editor.getEditorState().read(() => {
      const list = $getRoot().getFirstChildOrThrow() as ListNode;
      expect(list.getListType()).toBe('check');
      expect(list.getTextContent()).toContain('\t');
    });
  });
});
