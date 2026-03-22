import {CHECK_LIST_FLAT_TABS} from './lexicalMarkdownCheckListFlatTabs';
import {
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  $isRootOrShadowRoot,
  $isTextNode,
  COLLABORATION_TAG,
  HISTORIC_TAG,
  type ElementNode,
  type LexicalEditor,
  type LexicalNode,
} from 'lexical';

type CheckListElementTransformer = {
  regExp: RegExp;
  replace: (
    parentNode: ElementNode,
    children: LexicalNode[],
    match: RegExpMatchArray,
    isImport: boolean,
  ) => void;
};

const CHECK = CHECK_LIST_FLAT_TABS as unknown as CheckListElementTransformer;

/**
 * Lexical's `registerMarkdownShortcuts` skips element transformers when the caret jumps by more
 * than one character in a single update (paste, some IME commits, programmatic inserts). Then `[] `
 * stays plain text instead of becoming a checklist. This listener applies the same CHECK_LIST
 * replacement when the whole paragraph is exactly one trigger match and the caret is at the end.
 */
export function registerCheckListAtomicCatchUp(editor: LexicalEditor): () => void {
  return editor.registerUpdateListener(({tags, dirtyLeaves, editorState}) => {
    if (tags.has(COLLABORATION_TAG) || tags.has(HISTORIC_TAG)) {
      return;
    }
    if (editor.isComposing()) {
      return;
    }

    const anchorKey = editorState.read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
        return null;
      }
      const key = selection.anchor.key;
      if (!dirtyLeaves.has(key)) {
        return null;
      }
      const anchorNode = selection.anchor.getNode();
      if (!$isTextNode(anchorNode)) {
        return null;
      }
      const parent = anchorNode.getParent();
      if (
        !$isParagraphNode(parent) ||
        !$isRootOrShadowRoot(parent.getParentOrThrow()) ||
        parent.getFirstChild() !== anchorNode
      ) {
        return null;
      }
      const text = anchorNode.getTextContent();
      const match = text.match(CHECK.regExp);
      if (
        !match ||
        match[0].length !== text.length ||
        selection.anchor.offset !== text.length ||
        text[selection.anchor.offset - 1] !== ' '
      ) {
        return null;
      }
      return key;
    });

    if (anchorKey === null) {
      return;
    }

    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
        return;
      }
      const anchorNode = selection.anchor.getNode();
      if (!$isTextNode(anchorNode) || anchorNode.getKey() !== anchorKey) {
        return;
      }
      const parent = anchorNode.getParent();
      if (
        !$isParagraphNode(parent) ||
        !$isRootOrShadowRoot(parent.getParentOrThrow()) ||
        parent.getFirstChild() !== anchorNode
      ) {
        return;
      }
      const text = anchorNode.getTextContent();
      const match = text.match(CHECK.regExp);
      if (
        !match ||
        match[0].length !== text.length ||
        selection.anchor.offset !== text.length ||
        text[selection.anchor.offset - 1] !== ' '
      ) {
        return;
      }
      CHECK.replace(parent, [], match, false);
    });
  });
}
