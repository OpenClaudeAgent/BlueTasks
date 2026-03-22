/** @vitest-environment jsdom */
import {act, renderHook} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import type {PointerEvent as ReactPointerEvent} from 'react';
import {useResizableSidebarWidth} from './useResizableSidebarWidth';

const STORAGE_KEY = 'bluetasks.sidebarWidthPx';

function pointerDown(clientX: number) {
  return {
    preventDefault: vi.fn(),
    clientX,
    currentTarget: document.createElement('div'),
  } as unknown as ReactPointerEvent<HTMLDivElement>;
}

describe('useResizableSidebarWidth', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.style.cssText = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses default width when localStorage is empty', () => {
    const {result} = renderHook(() => useResizableSidebarWidth());
    expect(result.current.sidebarWidth).toBe(248);
    expect(result.current.minWidth).toBe(200);
    expect(result.current.maxWidth).toBe(480);
  });

  it('reads and clamps stored width from localStorage', () => {
    localStorage.setItem(STORAGE_KEY, '300');
    const {result} = renderHook(() => useResizableSidebarWidth());
    expect(result.current.sidebarWidth).toBe(300);
  });

  it('clamps stored width above max', () => {
    localStorage.setItem(STORAGE_KEY, '9000');
    const {result} = renderHook(() => useResizableSidebarWidth());
    expect(result.current.sidebarWidth).toBe(480);
  });

  it('clamps stored width below min', () => {
    localStorage.setItem(STORAGE_KEY, '10');
    const {result} = renderHook(() => useResizableSidebarWidth());
    expect(result.current.sidebarWidth).toBe(200);
  });

  it('ignores non-finite stored values', () => {
    localStorage.setItem(STORAGE_KEY, 'not-a-number');
    const {result} = renderHook(() => useResizableSidebarWidth());
    expect(result.current.sidebarWidth).toBe(248);
  });

  it('falls back to default when localStorage.getItem throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const {result} = renderHook(() => useResizableSidebarWidth());
    expect(result.current.sidebarWidth).toBe(248);
  });

  it('updates width on pointer drag and persists to localStorage', () => {
    const {result} = renderHook(() => useResizableSidebarWidth());
    expect(result.current.sidebarWidth).toBe(248);

    act(() => {
      result.current.onResizePointerDown(pointerDown(100));
    });

    act(() => {
      window.dispatchEvent(new PointerEvent('pointermove', {clientX: 150}));
    });
    expect(result.current.sidebarWidth).toBe(298);

    act(() => {
      window.dispatchEvent(new PointerEvent('pointerup', {clientX: 150}));
    });

    expect(localStorage.getItem(STORAGE_KEY)).toBe('298');
    expect(document.body.style.cursor).toBe('');
  });

  it('ignores localStorage.setItem failure on pointerup', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    const {result} = renderHook(() => useResizableSidebarWidth());

    act(() => {
      result.current.onResizePointerDown(pointerDown(0));
    });
    act(() => {
      window.dispatchEvent(new PointerEvent('pointermove', {clientX: 50}));
    });
    act(() => {
      window.dispatchEvent(new PointerEvent('pointerup'));
    });

    expect(result.current.sidebarWidth).toBeGreaterThan(0);
  });

  it('pointercancel ends drag like pointerup', () => {
    const {result} = renderHook(() => useResizableSidebarWidth());
    act(() => {
      result.current.onResizePointerDown(pointerDown(100));
    });
    act(() => {
      window.dispatchEvent(new PointerEvent('pointermove', {clientX: 120}));
    });
    act(() => {
      window.dispatchEvent(new PointerEvent('pointercancel'));
    });
    expect(document.body.style.cursor).toBe('');
  });

  it('end handler is idempotent (double pointerup)', () => {
    const {result} = renderHook(() => useResizableSidebarWidth());
    act(() => {
      result.current.onResizePointerDown(pointerDown(100));
    });
    act(() => {
      window.dispatchEvent(new PointerEvent('pointerup'));
    });
    act(() => {
      window.dispatchEvent(new PointerEvent('pointerup'));
    });
    expect(document.body.style.cursor).toBe('');
  });
});
