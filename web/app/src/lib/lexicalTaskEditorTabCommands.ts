import {
  $getSelection,
  $isElementNode,
  $isParagraphNode,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_CRITICAL,
  INSERT_TAB_COMMAND,
  KEY_TAB_COMMAND,
  mergeRegister,
  type LexicalEditor,
  type LexicalNode,
} from 'lexical';
import {$isHeadingNode, $isQuoteNode} from '@lexical/rich-text';
import {$isListItemNode} from '@lexical/list';
import {$isCodeNode} from '@lexical/code';
import {$isTableCellNode} from '@lexical/table';
import {$findMatchingParent, $getNearestBlockElementAncestorOrThrow} from '@lexical/utils';
import {$tryIndentChecklistItemFromTab} from './lexicalChecklistTabIndent';

/**
 * Lexical's TabIndentation extension maps Tab to INDENT_CONTENT_COMMAND at block start when
 * `canIndent()` is true. Paragraphs qualify, so Tab never reaches INSERT_TAB — markdown shortcuts
 * that need a literal `\t` (e.g. `[] ` → checklist) break. We force INSERT_TAB for paragraph /
 * heading / quote (KEY_TAB at CRITICAL) when not inside a list row.
 *
 * Checklist rows use ListItemNode.setIndent via `$tryIndentChecklistItemFromTab` (before TabIndentation
 * can turn Tab into INDENT on an inner Paragraph inside a list item).
 *
 * Default INSERT_TAB inserts a TabNode; we insert U+0009 into the TextNode instead.
 */
export function $shouldForceLiteralTabForMarkdownShortcuts(
  selection: ReturnType<typeof $getSelection>,
): boolean {
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
    return false;
  }
  const anchor = selection.anchor;
  const focus = selection.focus;
  const first = focus.isBefore(anchor) ? focus : anchor;
  const startNode = first.getNode();
  if ($findMatchingParent(startNode, $isListItemNode) !== null) {
    return false;
  }
  let block: ReturnType<typeof $getNearestBlockElementAncestorOrThrow>;
  try {
    block = $getNearestBlockElementAncestorOrThrow(startNode);
  } catch {
    return false;
  }
  return $isParagraphNode(block) || $isHeadingNode(block) || $isQuoteNode(block);
}

function $isLiteralTabElementSurface(node: LexicalNode): boolean {
  return (
    $isElementNode(node) &&
    $findMatchingParent(node, $isListItemNode) === null &&
    ($isParagraphNode(node) || $isHeadingNode(node) || $isQuoteNode(node))
  );
}

/**
 * Registers KEY_TAB + INSERT_TAB handlers for the task editor (same behavior as production).
 * Kept in one module so Vitest can lock the checklist / markdown Tab contract.
 */
export function registerTaskEditorTabCommands(editor: LexicalEditor): () => void {
  return mergeRegister(
    editor.registerCommand(
      KEY_TAB_COMMAND,
      (event: KeyboardEvent) => {
        if (event.shiftKey) {
          return false;
        }
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false;
        }
        const anchorNode = selection.anchor.getNode();
        if ($findMatchingParent(anchorNode, $isTableCellNode) !== null) {
          return false;
        }
        const block = $findMatchingParent(anchorNode, (n) => $isElementNode(n) && !n.isInline());
        if (block !== null && $isCodeNode(block)) {
          return false;
        }
        if ($tryIndentChecklistItemFromTab()) {
          event.preventDefault();
          return true;
        }
        if (!$shouldForceLiteralTabForMarkdownShortcuts(selection)) {
          return false;
        }
        event.preventDefault();
        return editor.dispatchCommand(INSERT_TAB_COMMAND, undefined);
      },
      COMMAND_PRIORITY_CRITICAL,
    ),
    editor.registerCommand(
      INSERT_TAB_COMMAND,
      () => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false;
        }
        const anchorNode = selection.anchor.getNode();
        if ($findMatchingParent(anchorNode, $isTableCellNode) !== null) {
          return false;
        }

        if ($isListItemNode(anchorNode)) {
          if ($tryIndentChecklistItemFromTab()) {
            return true;
          }
          return false;
        }

        const textBlock = $findMatchingParent(anchorNode, (n) => $isElementNode(n) && !n.isInline());
        if (textBlock !== null && $isCodeNode(textBlock)) {
          return false;
        }

        if ($tryIndentChecklistItemFromTab()) {
          return true;
        }

        if ($isTextNode(anchorNode)) {
          selection.insertText('\t');
          return true;
        }

        if (selection.anchor.type === 'element' && $isLiteralTabElementSurface(anchorNode)) {
          selection.insertText('\t');
          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    ),
  );
}
