import {
  $getSelection,
  $isRangeSelection,
  $isTabNode,
  $isTextNode,
  type LexicalEditor,
  ParagraphNode,
} from 'lexical';

/**
 * Lexical markdown element shortcuts need the anchor TextNode to be the paragraph's first child.
 * A leading TabNode (default INSERT_TAB) breaks that; merge the tab into the following TextNode.
 */
export function registerParagraphLeadingTabCoalesce(editor: LexicalEditor): () => void {
  return editor.registerNodeTransform(ParagraphNode, (paragraph) => {
    let first = paragraph.getFirstChild();
    let second = first?.getNextSibling();
    while (first !== null && second !== null && $isTabNode(first) && $isTextNode(second)) {
      const sizeBefore = second.getTextContentSize();
      second.spliceText(0, 0, '\t');
      if (sizeBefore > 0) {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const key = second.getKey();
          const bump = (offset: number) => offset + 1;
          if (selection.anchor.type === 'text' && selection.anchor.key === key) {
            selection.anchor.set(key, bump(selection.anchor.offset), 'text');
          }
          if (selection.focus.type === 'text' && selection.focus.key === key) {
            selection.focus.set(key, bump(selection.focus.offset), 'text');
          }
        }
      }
      first.remove();
      first = paragraph.getFirstChild();
      second = first?.getNextSibling();
    }
  });
}
