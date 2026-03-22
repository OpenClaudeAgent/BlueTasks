/** @vitest-environment jsdom */
import {setImmediate as setImmediatePromise} from 'node:timers/promises';
import {DRAG_DROP_PASTE} from '@lexical/rich-text';
import {describe, expect, it, vi, afterEach} from 'vitest';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  createEditor,
  PASTE_COMMAND,
  ParagraphNode,
  TextNode,
} from 'lexical';
import {TaskImageNode, $isTaskImageNode} from './lexicalTaskImageNode';
import {registerTaskImagePaste} from './lexicalTaskImagePaste';

function tinyPngFile(): File {
  return new File([Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], 't.png', {
    type: 'image/png',
  });
}

describe('registerTaskImagePaste', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Given DRAG_DROP_PASTE with image When handled Then inserts TaskImageNode', async () => {
    const editor = createEditor({
      namespace: 'paste-dd',
      nodes: [ParagraphNode, TextNode, TaskImageNode],
      onError: (e) => {
        throw e;
      },
    });
    const el = document.createElement('div');
    document.body.appendChild(el);
    editor.setRootElement(el);
    const unregister = registerTaskImagePaste(editor);

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const p = $createParagraphNode();
      p.append($createTextNode('x'));
      root.append(p);
      p.select(1, 1);
    });

    const handled = editor.dispatchCommand(DRAG_DROP_PASTE, [tinyPngFile()]);
    expect(handled).toBe(true);

    await setImmediatePromise();
    await vi.waitFor(
      () => {
        let hasImage = false;
        editor.getEditorState().read(() => {
          hasImage = $getRoot()
            .getChildren()
            .some((c) => $isTaskImageNode(c));
        });
        return hasImage;
      },
      {timeout: 3000},
    );

    unregister();
    editor.setRootElement(null);
    el.remove();
  });

  it('Given DRAG_DROP_PASTE with non-image When handled Then returns false', () => {
    const editor = createEditor({
      namespace: 'paste-dd-txt',
      nodes: [ParagraphNode, TextNode, TaskImageNode],
      onError: (e) => {
        throw e;
      },
    });
    const unregister = registerTaskImagePaste(editor);
    const txt = new File(['a'], 'a.txt', {type: 'text/plain'});
    expect(editor.dispatchCommand(DRAG_DROP_PASTE, [txt])).toBe(false);
    unregister();
  });

  it('Given PASTE_COMMAND with image in clipboard When handled Then preventDefault and inserts', async () => {
    const editor = createEditor({
      namespace: 'paste-cmd',
      nodes: [ParagraphNode, TextNode, TaskImageNode],
      onError: (e) => {
        throw e;
      },
    });
    const el = document.createElement('div');
    document.body.appendChild(el);
    editor.setRootElement(el);
    const unregister = registerTaskImagePaste(editor);

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const p = $createParagraphNode();
      p.append($createTextNode('x'));
      root.append(p);
      p.select(1, 1);
    });

    const png = tinyPngFile();
    const clipboardData = {
      files: [png],
      items: [],
      types: ['Files'],
    } as unknown as DataTransfer;
    const preventDefault = vi.fn();
    const ev = {
      type: 'paste',
      target: el,
      clipboardData,
      preventDefault,
      stopPropagation: vi.fn(),
    } as unknown as ClipboardEvent;

    const handled = editor.dispatchCommand(PASTE_COMMAND, ev);
    expect(handled).toBe(true);
    expect(preventDefault).toHaveBeenCalled();

    await setImmediatePromise();
    await vi.waitFor(
      () => {
        let hasImage = false;
        editor.getEditorState().read(() => {
          hasImage = $getRoot()
            .getChildren()
            .some((c) => $isTaskImageNode(c));
        });
        return hasImage;
      },
      {timeout: 3000},
    );

    unregister();
    editor.setRootElement(null);
    el.remove();
  });

  it('Given PASTE_COMMAND with no image files When handled Then returns false', () => {
    const editor = createEditor({
      namespace: 'paste-empty',
      nodes: [ParagraphNode, TextNode, TaskImageNode],
      onError: (e) => {
        throw e;
      },
    });
    const el = document.createElement('div');
    editor.setRootElement(el);
    const unregister = registerTaskImagePaste(editor);

    const clipboardData = {files: [], items: [], types: []} as unknown as DataTransfer;
    const ev = {
      type: 'paste',
      target: el,
      clipboardData,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as ClipboardEvent;

    expect(editor.dispatchCommand(PASTE_COMMAND, ev)).toBe(false);
    unregister();
    editor.setRootElement(null);
  });

  it('Given FileReader error When paste Then logs error', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const orig = globalThis.FileReader;
    class BadReader {
      onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null = null;
      onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null = null;
      readAsDataURL() {
        queueMicrotask(() =>
          this.onerror?.call(this as unknown as FileReader, {} as ProgressEvent<FileReader>),
        );
      }
    }
    // @ts-expect-error test double
    globalThis.FileReader = BadReader;

    const editor = createEditor({
      namespace: 'paste-fr-err',
      nodes: [ParagraphNode, TextNode, TaskImageNode],
      onError: (e) => {
        throw e;
      },
    });
    const el = document.createElement('div');
    document.body.appendChild(el);
    editor.setRootElement(el);
    const unregister = registerTaskImagePaste(editor);
    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const p = $createParagraphNode();
      p.append($createTextNode('x'));
      root.append(p);
      p.select(1, 1);
    });

    editor.dispatchCommand(DRAG_DROP_PASTE, [tinyPngFile()]);
    await setImmediatePromise();
    await setImmediatePromise();

    expect(errSpy).toHaveBeenCalled();
    globalThis.FileReader = orig;
    unregister();
    editor.setRootElement(null);
    el.remove();
  });
});
