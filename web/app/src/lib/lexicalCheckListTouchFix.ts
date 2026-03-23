import {$isListItemNode} from '@lexical/list';
import {isHTMLElement} from '@lexical/utils';
import {$getNearestNodeFromDOMNode, type LexicalEditor} from 'lexical';

/**
 * Wider than Lexical's ~20px strip so taps on the checkbox gutter register on mobile WebViews.
 * Hit test uses the checklist &lt;li&gt; bounding rect (not the event target's).
 */
const CHECK_HIT_PX = 40;

const recentToggle = new WeakMap<HTMLLIElement, number>();
const DEDUPE_MS = 450;

function eventTargetToHTMLElement(target: EventTarget | null): HTMLElement | null {
  if (target == null) {
    return null;
  }
  if (isHTMLElement(target)) {
    return target;
  }
  if (target instanceof Text) {
    return target.parentElement;
  }
  return null;
}

function findCheckListLiFromTarget(target: EventTarget | null): HTMLLIElement | null {
  let el = eventTargetToHTMLElement(target);
  while (el != null) {
    if (el.tagName === 'LI') {
      const parent = el.parentNode;
      if (
        parent != null &&
        isHTMLElement(parent) &&
        (parent as HTMLElement & {__lexicalListType?: string}).__lexicalListType === 'check'
      ) {
        return el as HTMLLIElement;
      }
    }
    el = el.parentElement;
  }
  return null;
}

function isInCheckboxStrip(li: HTMLElement, clientX: number): boolean {
  const rect = li.getBoundingClientRect();
  const rtl = li.dir === 'rtl';
  if (rtl) {
    return clientX < rect.right && clientX > rect.right - CHECK_HIT_PX;
  }
  return clientX > rect.left && clientX < rect.left + CHECK_HIT_PX;
}

function clientXFromEvent(event: Event): number | null {
  if ('clientX' in event && typeof (event as MouseEvent).clientX === 'number') {
    return (event as MouseEvent).clientX;
  }
  if (event instanceof TouchEvent && event.changedTouches.length > 0) {
    return event.changedTouches[0]!.clientX;
  }
  return null;
}

/**
 * Lexical CheckListPlugin toggles using a narrow strip of **event.target**'s rect; on touch the
 * target is often an inner node, so the strip misses. We resolve the checklist &lt;li&gt; and test
 * against its rect. Touch: handle `touchend` and `preventDefault` so a duplicate `click` does not
 * double-toggle; mouse: `click` only.
 */
export function registerCheckListTouchFix(editor: LexicalEditor): () => void {
  const consumeIfChecklistTap = (event: Event): boolean => {
    if (!editor.isEditable()) {
      return false;
    }
    if (event instanceof MouseEvent && event.button !== 0) {
      return false;
    }
    const li = findCheckListLiFromTarget(event.target);
    if (li == null) {
      return false;
    }
    const first = li.firstChild;
    if (isHTMLElement(first) && (first.tagName === 'UL' || first.tagName === 'OL')) {
      return false;
    }
    const clientX = clientXFromEvent(event);
    if (clientX == null) {
      return false;
    }
    if (!isInCheckboxStrip(li, clientX)) {
      return false;
    }

    const now = performance.now();
    const prev = recentToggle.get(li);
    if (prev != null && now - prev < DEDUPE_MS) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return true;
    }
    recentToggle.set(li, now);

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    editor.update(() => {
      const node = $getNearestNodeFromDOMNode(li);
      if (!$isListItemNode(node)) {
        return;
      }
      li.focus({preventScroll: true});
      node.toggleChecked();
    });
    return true;
  };

  const onTouchEnd = (e: TouchEvent): void => {
    void consumeIfChecklistTap(e);
  };

  const onClick = (e: MouseEvent): void => {
    void consumeIfChecklistTap(e);
  };

  return editor.registerRootListener((root, prev) => {
    if (prev != null) {
      prev.removeEventListener('touchend', onTouchEnd, true);
      prev.removeEventListener('click', onClick, true);
    }
    if (root != null) {
      root.addEventListener('touchend', onTouchEnd, {capture: true, passive: false});
      root.addEventListener('click', onClick, true);
    }
  });
}
