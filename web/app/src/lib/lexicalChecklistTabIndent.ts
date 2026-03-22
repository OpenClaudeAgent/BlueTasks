import {$getSelection, $isRangeSelection} from 'lexical';
import {$isListItemNode, $isListNode, type ListItemNode} from '@lexical/list';
import {$findMatchingParent} from '@lexical/utils';

/**
 * ListItemNode.canIndent() is false, so INDENT_CONTENT_COMMAND does not nest checklist rows.
 * Use setIndent (Lexical's internal $handleIndent) when Tab should outdent/nest in a check list.
 */
export function $tryIndentChecklistItemFromTab(): boolean {
  const selection = $getSelection();
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
    return false;
  }
  const anchorNode = selection.anchor.getNode();
  const listItem: ListItemNode | null = $isListItemNode(anchorNode)
    ? anchorNode
    : $findMatchingParent(anchorNode, $isListItemNode);
  if (listItem === null) {
    return false;
  }
  const listParent = listItem.getParent();
  if (!$isListNode(listParent) || listParent.getListType() !== 'check') {
    return false;
  }
  listItem.setIndent(listItem.getIndent() + 1);
  return true;
}
