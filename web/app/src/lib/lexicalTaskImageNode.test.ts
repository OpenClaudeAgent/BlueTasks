/** @vitest-environment jsdom */
import {describe, expect, it} from 'vitest';
import {$getRoot, createEditor} from 'lexical';
import {TaskImageNode, $createTaskImageNode, $isTaskImageNode} from './lexicalTaskImageNode';

describe('TaskImageNode', () => {
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
});
