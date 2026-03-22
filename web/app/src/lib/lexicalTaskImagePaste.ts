import type {LexicalEditor} from 'lexical';
import {
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  isDOMNode,
  isSelectionCapturedInDecoratorInput,
  PASTE_COMMAND,
  PASTE_TAG,
} from 'lexical';
import {DRAG_DROP_PASTE} from '@lexical/rich-text';
import {$insertNodeToNearestRoot, mergeRegister} from '@lexical/utils';
import {$createTaskImageNode} from './lexicalTaskImageNode';

function imageFilesFromClipboard(data: DataTransfer | null): File[] {
  if (!data) {
    return [];
  }
  const fromFiles = Array.from(data.files).filter((f) => f.type.startsWith('image/'));
  if (fromFiles.length > 0) {
    return fromFiles;
  }
  const out: File[] = [];
  for (const item of Array.from(data.items)) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file) {
        out.push(file);
      }
    }
  }
  return out;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
    reader.readAsDataURL(file);
  });
}

/**
 * Insère des images via la commande {@link DRAG_DROP_PASTE} de `@lexical/rich-text` (collage « fichiers seuls »
 * et glisser-déposer) et complète le collage Cmd/Ctrl+V lorsque le navigateur expose aussi du texte/HTML
 * en parallèle du fichier image (handler {@link PASTE_COMMAND} en priorité haute).
 */
export function registerTaskImagePaste(editor: LexicalEditor): () => void {
  const insertFromImageFiles = (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith('image/'));
    if (images.length === 0) {
      return;
    }
    void Promise.all(images.map((f) => readFileAsDataUrl(f)))
      .then((dataUrls) => {
        editor.update(
          () => {
            for (const url of dataUrls) {
              $insertNodeToNearestRoot($createTaskImageNode(url));
            }
          },
          {tag: PASTE_TAG},
        );
      })
      .catch((err) => {
        console.error('Failed to paste image', err);
      });
  };

  return mergeRegister(
    editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        if (!isDOMNode(event.target) || isSelectionCapturedInDecoratorInput(event.target)) {
          return false;
        }
        const files = imageFilesFromClipboard(event.clipboardData);
        if (files.length === 0) {
          return false;
        }
        event.preventDefault();
        insertFromImageFiles(files);
        return true;
      },
      COMMAND_PRIORITY_HIGH,
    ),
    editor.registerCommand(
      DRAG_DROP_PASTE,
      (files: File[]) => {
        const list = Array.from(files);
        const images = list.filter((f) => f.type.startsWith('image/'));
        if (images.length === 0) {
          return false;
        }
        insertFromImageFiles(images);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    ),
  );
}
