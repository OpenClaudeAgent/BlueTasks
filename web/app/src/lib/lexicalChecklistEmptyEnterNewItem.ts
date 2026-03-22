import type {LexicalEditor} from 'lexical';
import {
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_NORMAL,
  INSERT_PARAGRAPH_COMMAND,
} from 'lexical';
import {
  $createListItemNode,
  $isListItemNode,
  $isListNode,
  type ListItemNode,
} from '@lexical/list';

/**
 * Lexical's $handleListInsertParagraph (ListPlugin, INSERT_PARAGRAPH, LOW) exits the list when the
 * current item is empty. For checklists, Enter on an empty line should add another checkbox row.
 */
export function registerChecklistEmptyEnterNewItem(editor: LexicalEditor): () => void {
  return editor.registerCommand(
    INSERT_PARAGRAPH_COMMAND,
    () => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
        return false;
      }
      const anchor = selection.anchor.getNode();
      let listItem: ListItemNode | null = null;
      if ($isListItemNode(anchor) && anchor.getChildrenSize() === 0) {
        listItem = anchor;
      } else if ($isTextNode(anchor)) {
        const parentListItem = anchor.getParent();
        if (
          $isListItemNode(parentListItem) &&
          parentListItem
            .getChildren()
            .every(
              (node) => $isTextNode(node) && node.getTextContent().trim() === '',
            )
        ) {
          listItem = parentListItem;
        }
      }
      if (listItem === null) {
        return false;
      }
      const parent = listItem.getParent();
      if (!$isListNode(parent) || parent.getListType() !== 'check') {
        return false;
      }
      const newItem = $createListItemNode(false);
      listItem.insertAfter(newItem);
      const text = $createTextNode('');
      newItem.append(text);
      newItem.setTextStyle(selection.style).setTextFormat(selection.format);
      text.select();
      return true;
    },
    COMMAND_PRIORITY_NORMAL,
  );
}
