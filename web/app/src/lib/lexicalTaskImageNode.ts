import {
  $applyNodeReplacement,
  DecoratorNode,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from 'lexical';
import {addClassNamesToElement} from '@lexical/utils';

export type SerializedTaskImageNode = Spread<
  {
    altText: string;
    src: string;
    type: 'task-image';
    version: 1;
  },
  SerializedLexicalNode
>;

export class TaskImageNode extends DecoratorNode<unknown> {
  __altText: string;
  __src: string;

  static getType(): string {
    return 'task-image';
  }

  static clone(node: TaskImageNode): TaskImageNode {
    return new TaskImageNode(node.__src, node.__altText, node.__key);
  }

  constructor(src = '', altText = '', key?: NodeKey) {
    super(key);
    this.__src = src;
    this.__altText = altText;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const wrap = document.createElement('span');
    addClassNamesToElement(wrap, config.theme.image ?? '');
    const img = document.createElement('img');
    img.src = this.__src;
    img.alt = this.__altText;
    img.draggable = false;
    wrap.appendChild(img);
    return wrap;
  }

  exportDOM(): {element: HTMLElement} {
    const img = document.createElement('img');
    img.src = this.__src;
    img.alt = this.__altText;
    return {element: img};
  }

  static importJSON(serializedNode: SerializedTaskImageNode): TaskImageNode {
    const {altText, src} = serializedNode;
    return $createTaskImageNode(src, altText ?? '').updateFromJSON(serializedNode);
  }

  exportJSON(): SerializedTaskImageNode {
    return {
      ...super.exportJSON(),
      altText: this.__altText,
      src: this.__src,
      type: 'task-image',
      version: 1,
    };
  }

  getTextContent(): string {
    return '\n';
  }

  isInline(): false {
    return false;
  }

  updateDOM(prevNode: TaskImageNode, dom: HTMLElement): boolean {
    if (prevNode.__src !== this.__src || prevNode.__altText !== this.__altText) {
      const img = dom.querySelector('img');
      if (img) {
        img.src = this.__src;
        img.alt = this.__altText;
      }
    }
    return false;
  }
}

export function $createTaskImageNode(src: string, altText = ''): TaskImageNode {
  return $applyNodeReplacement(new TaskImageNode(src, altText));
}

export function $isTaskImageNode(node: LexicalNode | null | undefined): node is TaskImageNode {
  return node instanceof TaskImageNode;
}
