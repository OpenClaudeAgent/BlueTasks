import {useEffect, useRef, type RefObject} from 'react';

type Args = {
  expanded: boolean;
  autoFocusTitle: boolean;
  taskId: string;
  titleInputRef: RefObject<HTMLInputElement | null>;
  onConsumed?: () => void;
};

export function useAutoFocusTaskTitle({
  expanded,
  autoFocusTitle,
  taskId,
  titleInputRef,
  onConsumed,
}: Args): void {
  const onConsumedRef = useRef(onConsumed);

  useEffect(() => {
    onConsumedRef.current = onConsumed;
  });

  useEffect(() => {
    if (!expanded || !autoFocusTitle) {
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      const el = titleInputRef.current;
      if (el) {
        el.focus();
        el.select();
      }
      onConsumedRef.current?.();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [expanded, autoFocusTitle, taskId, titleInputRef]);
}
