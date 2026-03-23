/** @vitest-environment jsdom */
import {describe, expect, it} from 'vitest';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  createEditor,
  ParagraphNode,
  TextNode,
} from 'lexical';
import {
  $createHorizontalRuleNode,
  HorizontalRuleNode,
} from '@lexical/react/LexicalHorizontalRuleNode';
import {MARKDOWN_HORIZONTAL_RULE} from './lexicalMarkdownHorizontalRule';

describe('MARKDOWN_HORIZONTAL_RULE', () => {
  it('Given horizontal rule node When export Then returns thematic break markdown', () => {
    const editor = createEditor({
      namespace: 'md-hr-export',
      nodes: [ParagraphNode, TextNode, HorizontalRuleNode],
      onError: console.error,
    });
    editor.update(() => {
      const hr = $createHorizontalRuleNode();
      expect(MARKDOWN_HORIZONTAL_RULE.export(hr)).toBe('---');
    });
  });

  it('Given paragraph When export Then returns null', () => {
    const editor = createEditor({
      namespace: 'md-hr-export-p',
      nodes: [ParagraphNode, TextNode, HorizontalRuleNode],
      onError: console.error,
    });
    editor.update(() => {
      const p = $createParagraphNode();
      expect(MARKDOWN_HORIZONTAL_RULE.export(p)).toBeNull();
    });
  });

  it('Given regExp When thematic break line Then matches', () => {
    expect(MARKDOWN_HORIZONTAL_RULE.regExp.test('---')).toBe(true);
    expect(MARKDOWN_HORIZONTAL_RULE.regExp.test('--- ')).toBe(true);
    expect(MARKDOWN_HORIZONTAL_RULE.regExp.test('***')).toBe(true);
    expect(MARKDOWN_HORIZONTAL_RULE.regExp.test('___')).toBe(true);
    expect(MARKDOWN_HORIZONTAL_RULE.regExp.test('--')).toBe(false);
  });

  it('Given replace When isImport Then replaces paragraph with horizontal rule', () => {
    const editor = createEditor({
      namespace: 'md-hr-replace',
      nodes: [ParagraphNode, TextNode, HorizontalRuleNode],
      onError: console.error,
    });
    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const p = $createParagraphNode();
      const t = $createTextNode('---');
      p.append(t);
      root.append(p);
      MARKDOWN_HORIZONTAL_RULE.replace(p, [t], ['---'], true);
      expect(
        $getRoot()
          .getChildren()
          .some((n) => n.getType() === 'horizontalrule'),
      ).toBe(true);
    });
  });

  it('Scenario: replace while typing (not import) When next sibling is paragraph Then focuses it', () => {
    const editor = createEditor({
      namespace: 'md-hr-replace-type',
      nodes: [ParagraphNode, TextNode, HorizontalRuleNode],
      onError: console.error,
    });
    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const p = $createParagraphNode();
      const t = $createTextNode('---');
      p.append(t);
      const after = $createParagraphNode();
      root.append(p);
      root.append(after);
      MARKDOWN_HORIZONTAL_RULE.replace(p, [t], ['---'], false);
      const hr = $getRoot().getFirstChildOrThrow();
      expect(hr.getType()).toBe('horizontalrule');
      expect(hr.getNextSibling()?.getType()).toBe('paragraph');
    });
  });

  it('Scenario: replace while typing When no paragraph after rule Then inserts empty paragraph and selects', () => {
    const editor = createEditor({
      namespace: 'md-hr-replace-tail',
      nodes: [ParagraphNode, TextNode, HorizontalRuleNode],
      onError: console.error,
    });
    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const p = $createParagraphNode();
      const t = $createTextNode('---');
      p.append(t);
      root.append(p);
      MARKDOWN_HORIZONTAL_RULE.replace(p, [t], ['---'], false);
      const hr = $getRoot().getFirstChildOrThrow();
      expect(hr.getType()).toBe('horizontalrule');
      expect(hr.getNextSibling()?.getType()).toBe('paragraph');
    });
  });

  it('Scenario: replace with extra non-text children When isImport Then appends remainder after HR', () => {
    const editor = createEditor({
      namespace: 'md-hr-replace-rest',
      nodes: [ParagraphNode, TextNode, HorizontalRuleNode],
      onError: console.error,
    });
    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const p = $createParagraphNode();
      const dash = $createTextNode('---');
      const extra = $createTextNode('more');
      p.append(dash);
      p.append(extra);
      root.append(p);
      MARKDOWN_HORIZONTAL_RULE.replace(p, [dash, extra], ['---'], true);
      const hr = $getRoot().getFirstChildOrThrow();
      expect(hr.getType()).toBe('horizontalrule');
      const tail = hr.getNextSiblingOrThrow();
      expect(tail.getType()).toBe('paragraph');
      expect(tail.getTextContent()).toBe('more');
    });
  });
});
