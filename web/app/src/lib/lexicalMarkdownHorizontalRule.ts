import {
  $createParagraphNode,
  $isParagraphNode,
  $isTextNode,
  type ElementNode,
  type LexicalNode,
} from 'lexical';
import type {ElementTransformer} from '@lexical/markdown';
import {
  $createHorizontalRuleNode,
  $isHorizontalRuleNode,
  HorizontalRuleNode,
} from '@lexical/react/LexicalHorizontalRuleNode';

/**
 * CommonMark thematic break: 3+ `-`, `*`, or `_` on a line; optional spaces after.
 * When typing, Lexical only runs after a trailing space (same rule as `# ` headings).
 */
export const MARKDOWN_HORIZONTAL_RULE: ElementTransformer = {
  dependencies: [HorizontalRuleNode],
  export: (node) => ($isHorizontalRuleNode(node) ? '---' : null),
  regExp: /^(?:\*{3,}|_{3,}|-{3,})(?:\s+)?$/,
  replace: (
    parentNode: ElementNode,
    children: LexicalNode[],
    _match: string[],
    isImport: boolean,
  ) => {
    const hr = $createHorizontalRuleNode();
    parentNode.replace(hr);
    const rest = children.filter((n) => !$isTextNode(n) || n.getTextContent().length > 0);
    if (rest.length > 0) {
      const p = $createParagraphNode();
      p.append(...rest);
      hr.insertAfter(p);
    }
    if (!isImport) {
      const next = hr.getNextSibling();
      if ($isParagraphNode(next)) {
        next.select(0, 0);
      } else {
        const p = $createParagraphNode();
        hr.insertAfter(p);
        p.select(0, 0);
      }
    }
  },
  type: 'element',
};
