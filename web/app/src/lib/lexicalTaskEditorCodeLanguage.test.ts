/** @vitest-environment jsdom */
import {describe, expect, it, vi} from 'vitest';
import {
  $createParagraphNode,
  $createRangeSelection,
  $createTextNode,
  $getRoot,
  $setSelection,
  createEditor,
  ParagraphNode,
  TextNode,
} from 'lexical';
import {
  $createCodeNode,
  $isCodeHighlightNode,
  $isCodeNode,
  CodeHighlightNode,
  CodeNode,
} from '@lexical/code';
import {$getCodeNodeFromSelection} from './lexicalTaskEditorCodeLanguage';
import {registerTaskEditorCodeHighlighting} from './lexicalCodeShiki';

describe('$getCodeNodeFromSelection', () => {
  it('returns CodeNode when anchor is inside the block', () => {
    const editor = createEditor({
      namespace: 'code-lang-sel',
      nodes: [ParagraphNode, TextNode, CodeNode, CodeHighlightNode],
      onError: console.error,
    });

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const code = $createCodeNode('javascript');
      const inner = $createTextNode('hello');
      code.append(inner);
      root.append(code);
      expect(code.getTextContent()).toBe('hello');
      const sel = $createRangeSelection();
      sel.anchor.set(inner.getKey(), 1, 'text');
      sel.focus.set(inner.getKey(), 1, 'text');
      $setSelection(sel);
      const node = $getCodeNodeFromSelection();
      expect(node).not.toBeNull();
      expect(node).toBe(code);
      expect(node!.getLanguage()).toBe('javascript');
    });
  });

  it('returns null when selection is in a paragraph', () => {
    const editor = createEditor({
      namespace: 'code-lang-par',
      nodes: [ParagraphNode, TextNode, CodeNode, CodeHighlightNode],
      onError: console.error,
    });

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const p = $createParagraphNode();
      p.append($createTextNode('plain'));
      root.append(p);
      const t = p.getFirstChildOrThrow();
      const sel = $createRangeSelection();
      sel.anchor.set(t.getKey(), 0, 'text');
      sel.focus.set(t.getKey(), 0, 'text');
      $setSelection(sel);
      expect($getCodeNodeFromSelection()).toBeNull();
    });
  });

  it('returns null when there is no range selection', () => {
    const editor = createEditor({
      namespace: 'code-lang-no-sel',
      nodes: [ParagraphNode, TextNode, CodeNode, CodeHighlightNode],
      onError: console.error,
    });

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const code = $createCodeNode('javascript');
      code.append($createTextNode('x'));
      root.append(code);
      $setSelection(null);
      expect($getCodeNodeFromSelection()).toBeNull();
    });
  });
});

describe('Code block language change with Shiki', () => {
  it(
    'setLanguage updates CodeNode and Shiki injects code-highlight children for Python',
    async () => {
    const source = 'def foo(): pass';
    const onError = vi.fn();
    const editor = createEditor({
      namespace: 'code-lang-set',
      nodes: [ParagraphNode, TextNode, CodeNode, CodeHighlightNode],
      onError,
    });
    const unregister = registerTaskEditorCodeHighlighting(editor);

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const code = $createCodeNode('javascript');
      const plain = $createTextNode(source);
      code.append(plain);
      root.append(code);
      expect(code.getTextContent()).toBe(source);
      const sel = $createRangeSelection();
      sel.anchor.set(plain.getKey(), 0, 'text');
      sel.focus.set(plain.getKey(), 0, 'text');
      $setSelection(sel);
    });

    editor.update(() => {
      const code = $getCodeNodeFromSelection();
      expect(code).not.toBeNull();
      code!.setLanguage('python');
      const child = code!.getFirstChild();
      expect(child).not.toBeNull();
      const sel = $createRangeSelection();
      sel.anchor.set(child!.getKey(), 0, 'text');
      sel.focus.set(child!.getKey(), 0, 'text');
      $setSelection(sel);
      expect($getCodeNodeFromSelection()).toBe(code);
      expect($getCodeNodeFromSelection()?.getLanguage()).toBe('python');
    });

    await vi.waitFor(
      () => {
        editor.getEditorState().read(() => {
          const first = $getRoot().getFirstChildOrThrow();
          expect($isCodeNode(first)).toBe(true);
          const code = first as CodeNode;
          expect(code.getLanguage()).toBe('python');
          expect(code.getTextContent()).toBe(source);
          const children = code.getChildren();
          const highlights = children.filter((c) => $isCodeHighlightNode(c));
          expect(highlights.length).toBe(children.length);
          expect(highlights.length).toBeGreaterThan(0);
          const stitched = highlights.map((h) => h.getTextContent()).join('');
          expect(stitched).toBe(source);
          const hasDefKeyword = highlights.some((h) => h.getTextContent() === 'def');
          expect(hasDefKeyword).toBe(true);
          const defNode = highlights.find((h) => h.getTextContent() === 'def');
          expect(defNode).toBeDefined();
          expect($isCodeHighlightNode(defNode)).toBe(true);
        });
      },
      {timeout: 20_000, interval: 50},
    );

    editor.update(() => {
      const code = $getRoot().getFirstChildOrThrow() as CodeNode;
      const firstHighlight = code.getChildren().find((c) => $isCodeHighlightNode(c));
      expect(firstHighlight).toBeDefined();
      expect($isCodeHighlightNode(firstHighlight)).toBe(true);
      const token = firstHighlight!;
      expect(token.getTextContent().length).toBeGreaterThan(0);
      const sel = $createRangeSelection();
      sel.anchor.set(token.getKey(), 0, 'text');
      sel.focus.set(token.getKey(), 0, 'text');
      $setSelection(sel);
      expect($getCodeNodeFromSelection()).toBe(code);
      expect($getCodeNodeFromSelection()?.getLanguage()).toBe('python');
    });

    expect(onError).not.toHaveBeenCalled();
    unregister();
    expect(() => unregister()).not.toThrow();
    },
    25_000,
  );
});
