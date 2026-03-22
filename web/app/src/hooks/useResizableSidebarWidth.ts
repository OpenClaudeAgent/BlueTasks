import {useCallback, useState, type PointerEvent as ReactPointerEvent} from 'react';

const STORAGE_KEY = 'bluetasks.sidebarWidthPx';
const DEFAULT_WIDTH = 248;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function readStoredWidth(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const n = Number.parseInt(raw, 10);
      if (Number.isFinite(n)) {
        return clamp(n, MIN_WIDTH, MAX_WIDTH);
      }
    }
  } catch {
    /* private mode */
  }
  return DEFAULT_WIDTH;
}

/**
 * Persisted width (px) for the left sidebar + pointer-drag resize between sidebar and main.
 */
export function useResizableSidebarWidth() {
  const [width, setWidth] = useState(readStoredWidth);

  const onResizePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const startX = event.clientX;
      const startW = width;
      let lastW = startW;
      let ended = false;

      const onMove = (e: PointerEvent) => {
        lastW = clamp(startW + (e.clientX - startX), MIN_WIDTH, MAX_WIDTH);
        setWidth(lastW);
      };

      const onEnd = () => {
        if (ended) {
          return;
        }
        ended = true;
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onEnd);
        window.removeEventListener('pointercancel', onEnd);
        document.body.style.removeProperty('cursor');
        document.body.style.removeProperty('user-select');
        try {
          localStorage.setItem(STORAGE_KEY, String(lastW));
        } catch {
          /* ignore */
        }
      };

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onEnd);
      window.addEventListener('pointercancel', onEnd);
    },
    [width],
  );

  return {sidebarWidth: width, onResizePointerDown, minWidth: MIN_WIDTH, maxWidth: MAX_WIDTH};
}
