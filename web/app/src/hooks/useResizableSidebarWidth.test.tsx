/** @vitest-environment jsdom */
import {act, renderHook, waitFor} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import type {PointerEvent as ReactPointerEvent} from 'react';
import {
  SIDEBAR_DEFAULT_WIDTH_PX,
  SIDEBAR_MAX_WIDTH_PX,
  SIDEBAR_MIN_WIDTH_PX,
  SIDEBAR_WIDTH_STORAGE_KEY,
} from '../lib/sidebarLayout';
import {useResizableSidebarWidth} from './useResizableSidebarWidth';

function createPointerDownMock(clientX: number) {
  const preventDefault = vi.fn();
  const event = {
    preventDefault,
    clientX,
    currentTarget: document.createElement('div'),
  } as unknown as ReactPointerEvent<HTMLDivElement>;
  return {event, preventDefault};
}

describe('Feature: Resizable sidebar width', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.style.cssText = '';
    history.replaceState(null, '', '/');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rule: initial width', () => {
    it('Scenario: empty storage and no query — uses default width', () => {
      const {result} = renderHook(() => useResizableSidebarWidth());
      expect(result.current.sidebarWidth).toBe(SIDEBAR_DEFAULT_WIDTH_PX);
    });

    it('Scenario: valid stored width — restores clamped value', () => {
      localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, '300');
      const {result} = renderHook(() => useResizableSidebarWidth());
      expect(result.current.sidebarWidth).toBe(300);
    });

    it('Scenario: stored width above max — clamps to max', () => {
      localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, '9000');
      const {result} = renderHook(() => useResizableSidebarWidth());
      expect(result.current.sidebarWidth).toBe(SIDEBAR_MAX_WIDTH_PX);
    });

    it('Scenario: stored width below min — clamps to min', () => {
      localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, '10');
      const {result} = renderHook(() => useResizableSidebarWidth());
      expect(result.current.sidebarWidth).toBe(SIDEBAR_MIN_WIDTH_PX);
    });

    it('Scenario: stored value is not a finite number — falls back to default', () => {
      localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, 'not-a-number');
      const {result} = renderHook(() => useResizableSidebarWidth());
      expect(result.current.sidebarWidth).toBe(SIDEBAR_DEFAULT_WIDTH_PX);
    });

    it('Scenario: localStorage.getItem throws — falls back to default', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('blocked');
      });
      const {result} = renderHook(() => useResizableSidebarWidth());
      expect(result.current.sidebarWidth).toBe(SIDEBAR_DEFAULT_WIDTH_PX);
    });

    it('Scenario: URL has sidebarWidthPx — overrides localStorage', () => {
      localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, '300');
      history.replaceState(null, '', '/?sidebarWidthPx=100');
      const {result} = renderHook(() => useResizableSidebarWidth());
      expect(result.current.sidebarWidth).toBe(100);
    });

    it('Scenario: URL sidebarWidthPx out of range — clamps like storage', () => {
      history.replaceState(null, '', '/?sidebarWidthPx=9000');
      const {result} = renderHook(() => useResizableSidebarWidth());
      expect(result.current.sidebarWidth).toBe(SIDEBAR_MAX_WIDTH_PX);
    });

    it('Scenario: mount with sidebarWidthPx — removes only that param and keeps the rest', async () => {
      history.replaceState(null, '', '/?sidebarWidthPx=200&keep=1');
      renderHook(() => useResizableSidebarWidth());
      await waitFor(() => {
        expect(window.location.search).toBe('?keep=1');
      });
    });

    it('Scenario: invalid sidebarWidthPx — ignored; stored width wins', () => {
      localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, '300');
      history.replaceState(null, '', '/?sidebarWidthPx=nope');
      const {result} = renderHook(() => useResizableSidebarWidth());
      expect(result.current.sidebarWidth).toBe(300);
    });
  });

  describe('Rule: pointer drag resize', () => {
    it('Scenario: user drags wider — width updates, persists exact px, default is prevented', () => {
      const {result} = renderHook(() => useResizableSidebarWidth());
      expect(result.current.sidebarWidth).toBe(SIDEBAR_DEFAULT_WIDTH_PX);

      const {event, preventDefault} = createPointerDownMock(100);
      act(() => {
        result.current.onResizePointerDown(event);
      });
      expect(preventDefault).toHaveBeenCalledTimes(1);

      act(() => {
        window.dispatchEvent(new PointerEvent('pointermove', {clientX: 150}));
      });
      expect(result.current.sidebarWidth).toBe(SIDEBAR_DEFAULT_WIDTH_PX + 50);

      act(() => {
        window.dispatchEvent(new PointerEvent('pointerup', {clientX: 150}));
      });

      expect(localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY)).toBe(
        String(SIDEBAR_DEFAULT_WIDTH_PX + 50),
      );
      expect(document.body.style.cursor).toBe('');
      expect(document.body.style.userSelect).toBe('');
    });

    it('Scenario: drag beyond max — width stays at max', () => {
      const {result} = renderHook(() => useResizableSidebarWidth());
      const startX = 100;
      act(() => {
        result.current.onResizePointerDown(createPointerDownMock(startX).event);
      });
      act(() => {
        window.dispatchEvent(
          new PointerEvent('pointermove', {
            clientX: startX + (SIDEBAR_MAX_WIDTH_PX - SIDEBAR_DEFAULT_WIDTH_PX) + 999,
          }),
        );
      });
      expect(result.current.sidebarWidth).toBe(SIDEBAR_MAX_WIDTH_PX);
      act(() => {
        window.dispatchEvent(new PointerEvent('pointerup'));
      });
      expect(localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY)).toBe(String(SIDEBAR_MAX_WIDTH_PX));
    });

    it('Scenario: drag beyond min — width stays at min', () => {
      const {result} = renderHook(() => useResizableSidebarWidth());
      const startX = 100;
      act(() => {
        result.current.onResizePointerDown(createPointerDownMock(startX).event);
      });
      act(() => {
        window.dispatchEvent(
          new PointerEvent('pointermove', {
            clientX: startX - (SIDEBAR_DEFAULT_WIDTH_PX - SIDEBAR_MIN_WIDTH_PX) - 999,
          }),
        );
      });
      expect(result.current.sidebarWidth).toBe(SIDEBAR_MIN_WIDTH_PX);
      act(() => {
        window.dispatchEvent(new PointerEvent('pointerup'));
      });
      expect(localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY)).toBe(String(SIDEBAR_MIN_WIDTH_PX));
    });

    it('Scenario: localStorage.setItem throws on commit — in-memory width still exact', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota');
      });
      const {result} = renderHook(() => useResizableSidebarWidth());

      act(() => {
        result.current.onResizePointerDown(createPointerDownMock(0).event);
      });
      act(() => {
        window.dispatchEvent(new PointerEvent('pointermove', {clientX: 50}));
      });
      expect(result.current.sidebarWidth).toBe(SIDEBAR_DEFAULT_WIDTH_PX + 50);

      act(() => {
        window.dispatchEvent(new PointerEvent('pointerup'));
      });
      expect(result.current.sidebarWidth).toBe(SIDEBAR_DEFAULT_WIDTH_PX + 50);
    });

    it('Scenario: pointercancel — clears resize cursor like pointerup', () => {
      const {result} = renderHook(() => useResizableSidebarWidth());
      act(() => {
        result.current.onResizePointerDown(createPointerDownMock(100).event);
      });
      act(() => {
        window.dispatchEvent(new PointerEvent('pointermove', {clientX: 120}));
      });
      act(() => {
        window.dispatchEvent(new PointerEvent('pointercancel'));
      });
      expect(document.body.style.cursor).toBe('');
      expect(document.body.style.userSelect).toBe('');
    });

    it('Scenario: double pointerup — end handler stays idempotent', () => {
      const {result} = renderHook(() => useResizableSidebarWidth());
      act(() => {
        result.current.onResizePointerDown(createPointerDownMock(100).event);
      });
      act(() => {
        window.dispatchEvent(new PointerEvent('pointerup'));
      });
      act(() => {
        window.dispatchEvent(new PointerEvent('pointerup'));
      });
      expect(document.body.style.cursor).toBe('');
      expect(document.body.style.userSelect).toBe('');
    });
  });
});
