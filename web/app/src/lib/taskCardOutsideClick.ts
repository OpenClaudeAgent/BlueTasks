/**
 * Radix portals for pickers/dialogs opened from a task card render outside `article.taskCard`.
 * Clicks there must not collapse the expanded card.
 */
export const TASK_CARD_PORTAL_CLICK_ROOT_SELECTOR =
  '.datePopover, .footerPopover, .confirmDialog__overlay, .confirmDialog__content';

export function pointerDownShouldCollapseExpandedTask(options: {
  selectedTaskId: string | null;
  target: EventTarget | null;
  expandedTaskCard: Element | null;
}): boolean {
  const {selectedTaskId, target, expandedTaskCard} = options;
  if (!selectedTaskId) {
    return false;
  }
  if (!target || !(target instanceof Element)) {
    return false;
  }
  if (!expandedTaskCard) {
    return false;
  }
  // Clicks on any task card (expanded or another row) are handled by the card UI, not this dismiss path.
  if (target.closest('article.taskCard')) {
    return false;
  }
  if (target.closest(TASK_CARD_PORTAL_CLICK_ROOT_SELECTOR)) {
    return false;
  }
  return true;
}
