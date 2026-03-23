/** @vitest-environment jsdom */
import {describe, expect, it} from 'vitest';
import type {EditorConfig} from 'lexical';
import {$getRoot, createEditor} from 'lexical';
import {TaskImageNode, $createTaskImageNode, $isTaskImageNode} from './lexicalTaskImageNode';

const themeConfig = {theme: {image: 'task-img-wrap'}} as unknown as EditorConfig;

describe('Feature: TaskImageNode (Lexical decorator)', () => {
  it('Given JSON roundtrip When parseEditorState Then src and altText are preserved', () => {
    const editor = createEditor({
      namespace: 'task-image-json',
      nodes: [TaskImageNode],
      onError: console.error,
    });

    const src = 'data:image/png;base64,AAAA';
    const json = JSON.stringify({
      root: {
        children: [
          {
            altText: 'x',
            direction: null,
            format: '',
            indent: 0,
            src,
            type: 'task-image',
            version: 1,
          },
        ],
        direction: null,
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    });

    editor.setEditorState(editor.parseEditorState(json));

    editor.getEditorState().read(() => {
      const first = $getRoot().getFirstChildOrThrow();
      expect($isTaskImageNode(first)).toBe(true);
      const imageNode = first as TaskImageNode;
      const j = imageNode.exportJSON();
      expect(j.src).toBe(src);
      expect(j.altText).toBe('x');
    });
  });

  it('Given create node When exportJSON Then matches serialized shape', () => {
    const editor = createEditor({
      namespace: 'task-image-export',
      nodes: [TaskImageNode],
      onError: console.error,
    });

    editor.update(() => {
      const n = $createTaskImageNode('data:image/gif;base64,R0lGODlh', 'hi');
      const j = n.exportJSON();
      expect(j.type).toBe('task-image');
      expect(j.version).toBe(1);
      expect(j.src).toBe('data:image/gif;base64,R0lGODlh');
      expect(j.altText).toBe('hi');
    });
  });

  it('Scenario: createDOM When theme provides image class Then wraps img with themed span', () => {
    const editor = createEditor({
      namespace: 'task-image-dom',
      nodes: [TaskImageNode],
      onError: console.error,
    });
    editor.update(() => {
      const n = $createTaskImageNode('https://example.com/a.png', 'Logo');
      const el = n.createDOM(themeConfig);
      expect(el.tagName).toBe('SPAN');
      expect(el.classList.contains('task-img-wrap')).toBe(true);
      const img = el.querySelector('img');
      expect(img).not.toBeNull();
      expect(img!.getAttribute('src')).toBe('https://example.com/a.png');
      expect(img!.getAttribute('alt')).toBe('Logo');
      expect(img!.draggable).toBe(false);
    });
  });

  it('Scenario: src or alt change When updateDOM Then updates img attributes', () => {
    const editor = createEditor({
      namespace: 'task-image-update',
      nodes: [TaskImageNode],
      onError: console.error,
    });
    editor.update(() => {
      const prev = $createTaskImageNode('old.png', 'old');
      const next = $createTaskImageNode('new.png', 'new');
      const dom = prev.createDOM(themeConfig);
      const changed = next.updateDOM(prev, dom, themeConfig);
      expect(changed).toBe(false);
      expect(dom.querySelector('img')!.getAttribute('src')).toBe('new.png');
      expect(dom.querySelector('img')!.getAttribute('alt')).toBe('new');
    });
  });

  it('Scenario: DOM span missing img When updateDOM Then does not throw', () => {
    const editor = createEditor({
      namespace: 'task-image-update-nested',
      nodes: [TaskImageNode],
      onError: console.error,
    });
    editor.update(() => {
      const prev = $createTaskImageNode('a', 'b');
      const next = $createTaskImageNode('c', 'd');
      const dom = document.createElement('span');
      expect(() => next.updateDOM(prev, dom, themeConfig)).not.toThrow();
    });
  });

  it('Scenario: exportDOM When called Then returns standalone img element', () => {
    const editor = createEditor({
      namespace: 'task-image-export-dom',
      nodes: [TaskImageNode],
      onError: console.error,
    });
    editor.update(() => {
      const n = $createTaskImageNode('blob:x', 'Alt');
      const {element} = n.exportDOM();
      expect(element.tagName).toBe('IMG');
      expect(element.getAttribute('src')).toBe('blob:x');
      expect(element.getAttribute('alt')).toBe('Alt');
    });
  });

  it('Scenario: importJSON omits altText When parse Then uses empty string', () => {
    const editor = createEditor({
      namespace: 'task-image-import-alt',
      nodes: [TaskImageNode],
      onError: console.error,
    });
    editor.update(() => {
      const n = TaskImageNode.importJSON({
        type: 'task-image',
        version: 1,
        src: 's.png',
        altText: undefined as unknown as string,
      });
      expect(n.exportJSON().altText).toBe('');
    });
  });
});
