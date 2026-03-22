/**
 * Acceptance: Given a Lexical editor with code highlighting registered, when a CodeNode
 * holds JavaScript source, Shiki eventually tokenizes children into CodeHighlightNode (async).
 *
 * @vitest-environment jsdom
 */
import {describe, expect, it, vi} from 'vitest';
import {$createTextNode, $getRoot, createEditor, ParagraphNode, TextNode} from 'lexical';
import {
  $createCodeNode,
  $isCodeHighlightNode,
  $isCodeNode,
  CodeHighlightNode,
  CodeNode,
} from '@lexical/code';
import {registerTaskEditorCodeHighlighting} from './lexicalCodeShiki';

describe('registerTaskEditorCodeHighlighting', () => {
  it('Given CodeNode with javascript When Shiki finishes Then children include CodeHighlightNode', async () => {
    const onError = vi.fn();
    const editor = createEditor({
      namespace: 'code-shiki-tdd',
      nodes: [ParagraphNode, TextNode, CodeNode, CodeHighlightNode],
      onError,
    });
    const unregister = registerTaskEditorCodeHighlighting(editor);

    const source = 'const x = 1';
    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const code = $createCodeNode();
      code.setLanguage('javascript');
      code.append($createTextNode(source));
      root.append(code);
      expect(code.getTextContent()).toBe(source);
    });

    await vi.waitFor(
      () => {
        editor.getEditorState().read(() => {
          const root = $getRoot();
          const first = root.getFirstChildOrThrow();
          expect($isCodeNode(first)).toBe(true);
          const code = first;
          expect(code.getTextContent()).toBe(source);
          const children = code.getChildren();
          const highlights = children.filter((n) => $isCodeHighlightNode(n));
          expect(highlights.length).toBe(children.length);
          expect(highlights.length).toBeGreaterThan(0);
          expect(highlights.map((h) => h.getTextContent()).join('')).toBe(source);
          const hasConst = highlights.some((h) => h.getTextContent() === 'const');
          expect(hasConst).toBe(true);
        });
      },
      {timeout: 20_000, interval: 50},
    );

    unregister();
    expect(onError).not.toHaveBeenCalled();
  }, 25_000);
});
