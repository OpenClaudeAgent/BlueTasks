import {useEffect, useRef} from 'react';
import {pointerDownShouldCollapseExpandedTask} from '../lib/taskCardOutsideClick';

/**
 * Collapses the expanded task when the user presses outside its `article.taskCard`
 * (capture-phase `pointerdown` so another row can open in the same gesture).
 */
export function useDismissExpandedTaskOnOutsidePointerDown(
  selectedTaskId: string | null,
  onDismiss: () => void,
) {
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  });

  useEffect(() => {
    if (!selectedTaskId) {
      return;
    }

    const handler = (event: PointerEvent) => {
      const card = document.querySelector(
        `article.taskCard[data-task-id="${CSS.escape(selectedTaskId)}"]`,
      );
      if (
        !pointerDownShouldCollapseExpandedTask({
          selectedTaskId,
          target: event.target,
          expandedTaskCard: card,
        })
      ) {
        return;
      }
      onDismissRef.current();
    };

    document.addEventListener('pointerdown', handler, true);
    return () => document.removeEventListener('pointerdown', handler, true);
  }, [selectedTaskId]);
}
