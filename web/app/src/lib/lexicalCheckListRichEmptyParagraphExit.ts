import type {LexicalEditor} from 'lexical';
import {
  $createRangeSelection,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  $isTextNode,
  $setSelection,
  COMMAND_PRIORITY_NORMAL,
  INSERT_PARAGRAPH_COMMAND,
} from 'lexical';
import {
  $handleListInsertParagraph,
  $isListItemNode,
  $isListNode,
  type ListItemNode,
} from '@lexical/list';
import {$findMatchingParent} from '@lexical/utils';

/**
 * Rich-text checklists use ListItem → Paragraph → Text. Lexical's $handleListInsertParagraph only
 * treats direct TextNode children as empty, so Enter never exits. Normalize to an empty list item
 * (element selection) then delegate to Lexical.
 */
function $isCheckListItemWhitespaceOnlyRichText(listItem: ListItemNode): boolean {
  for (const child of listItem.getChildren()) {
    if ($isListNode(child)) {
      return false;
    }
    if ($isParagraphNode(child)) {
      if (child.getTextContent().trim() !== '') {
        return false;
      }
    } else if ($isTextNode(child)) {
      if (child.getTextContent().trim() !== '') {
        return false;
      }
    } else {
      return false;
    }
  }
  return true;
}

export function registerCheckListRichEmptyParagraphExit(editor: LexicalEditor): () => void {
  return editor.registerCommand(
    INSERT_PARAGRAPH_COMMAND,
    () => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
        return false;
      }
      const listItem = $findMatchingParent(selection.anchor.getNode(), $isListItemNode);
      if (listItem === null) {
        return false;
      }
      const parentList = listItem.getParent();
      if (!$isListNode(parentList)) {
        return false;
      }
      if (!$isListNode(parentList) || parentList.getListType() !== 'check') {
        return false;
      }

      if ($handleListInsertParagraph()) {
        return true;
      }

      if (!$isCheckListItemWhitespaceOnlyRichText(listItem)) {
        return false;
      }

      const children = listItem.getChildren();
      children.forEach((c) => c.remove());

      const sel = $createRangeSelection();
      sel.anchor.set(listItem.getKey(), 0, 'element');
      sel.focus.set(listItem.getKey(), 0, 'element');
      $setSelection(sel);

      return $handleListInsertParagraph();
    },
    COMMAND_PRIORITY_NORMAL,
  );
}
