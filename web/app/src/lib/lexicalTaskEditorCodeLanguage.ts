import {$isCodeNode, type CodeNode} from '@lexical/code';
import {$findMatchingParent} from '@lexical/utils';
import {$getSelection, $isRangeSelection} from 'lexical';

/** Nearest enclosing {@link CodeNode} when the range selection anchor is inside a code block. */
export function $getCodeNodeFromSelection(): CodeNode | null {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return null;
  }
  const anchor = selection.anchor.getNode();
  const code = $findMatchingParent(anchor, $isCodeNode);
  return code;
}
