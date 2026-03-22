import {useCallback, useEffect, useState, type PointerEvent as ReactPointerEvent} from 'react';
import {
  clampSidebarWidthPx,
  SIDEBAR_DEFAULT_WIDTH_PX,
  SIDEBAR_MAX_WIDTH_PX,
  SIDEBAR_MIN_WIDTH_PX,
  SIDEBAR_WIDTH_STORAGE_KEY,
} from '../lib/sidebarLayout';

function readStoredWidth(): number {
  try {
    const raw = localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
    if (raw) {
      const n = Number.parseInt(raw, 10);
      if (Number.isFinite(n)) {
        return clampSidebarWidthPx(n);
      }
    }
  } catch {
    /* private mode */
  }
  return SIDEBAR_DEFAULT_WIDTH_PX;
}

/** Optional `?sidebarWidthPx=200` one-shot width override (e.g. demos, environments without localStorage). */
function readQueryWidthOverride(): number | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = new URLSearchParams(window.location.search).get('sidebarWidthPx');
    if (!raw) {
      return null;
    }
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n)) {
      return null;
    }
    return clampSidebarWidthPx(n);
  } catch {
    return null;
  }
}

function readInitialWidth(): number {
  return readQueryWidthOverride() ?? readStoredWidth();
}

/**
 * Persisted width (px) for the left sidebar + pointer-drag resize between sidebar and main.
 */
export function useResizableSidebarWidth() {
  const [width, setWidth] = useState(readInitialWidth);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('sidebarWidthPx')) {
      return;
    }
    params.delete('sidebarWidthPx');
    const qs = params.toString();
    const next = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
    window.history.replaceState(null, '', next);
  }, []);

  const onResizePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const startX = event.clientX;
      const startW = width;
      let lastW = startW;
      let ended = false;

      const onMove = (e: PointerEvent) => {
        lastW = clampSidebarWidthPx(startW + (e.clientX - startX));
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
          localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(lastW));
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

  return {
    sidebarWidth: width,
    onResizePointerDown,
    minWidth: SIDEBAR_MIN_WIDTH_PX,
    maxWidth: SIDEBAR_MAX_WIDTH_PX,
  };
}
