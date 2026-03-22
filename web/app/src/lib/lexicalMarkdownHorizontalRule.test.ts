/** @vitest-environment jsdom */
import {describe, expect, it} from 'vitest';
import {$createParagraphNode, createEditor, ParagraphNode, TextNode} from 'lexical';
import {$createHorizontalRuleNode, HorizontalRuleNode} from '@lexical/react/LexicalHorizontalRuleNode';
import {MARKDOWN_HORIZONTAL_RULE} from './lexicalMarkdownHorizontalRule';

const noopTraverse = (): string => '';

describe('MARKDOWN_HORIZONTAL_RULE', () => {
  const {regExp: re} = MARKDOWN_HORIZONTAL_RULE;

  it('matches --- with trailing space (markdown shortcut)', () => {
    expect(re.test('--- ')).toBe(true);
  });

  it('matches --- alone (markdown import line)', () => {
    expect(re.test('---')).toBe(true);
  });

  it('matches *** and ___ variants', () => {
    expect(re.test('***')).toBe(true);
    expect(re.test('___ ')).toBe(true);
    expect(re.test('----')).toBe(true);
  });

  it('does not match list or heading lines', () => {
    expect(re.test('- item')).toBe(false);
    expect(re.test('## hi')).toBe(false);
  });

  it('export maps horizontal rule to --- and skips other nodes', () => {
    const editor = createEditor({
      namespace: 'test-hr-export',
      nodes: [ParagraphNode, TextNode, HorizontalRuleNode],
    });
    editor.update(() => {
      const hr = $createHorizontalRuleNode();
      const p = $createParagraphNode();
      expect(MARKDOWN_HORIZONTAL_RULE.export(hr, noopTraverse)).toBe('---');
      expect(MARKDOWN_HORIZONTAL_RULE.export(p, noopTraverse)).toBe(null);
    });
  });

});
