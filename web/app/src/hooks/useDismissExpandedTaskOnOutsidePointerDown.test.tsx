/** @vitest-environment jsdom */
import {describe, expect, it, vi, afterEach} from 'vitest';
import {renderHook} from '@testing-library/react';
import {useDismissExpandedTaskOnOutsidePointerDown} from './useDismissExpandedTaskOnOutsidePointerDown';

describe('Feature: useDismissExpandedTaskOnOutsidePointerDown', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  describe('Scenario: User clicks outside the expanded task', () => {
    it('given a selected task id and a matching card, when pointerdown fires outside, then onDismiss runs', () => {
      const onDismiss = vi.fn();
      const card = document.createElement('article');
      card.className = 'taskCard';
      card.dataset.taskId = 'task-1';
      const outside = document.createElement('div');
      outside.id = 'outside';
      document.body.append(card, outside);

      renderHook(() => useDismissExpandedTaskOnOutsidePointerDown('task-1', onDismiss));

      outside.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true}));

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('Scenario: User clicks inside the expanded task', () => {
    it('given a selected task, when pointerdown is inside the card, then onDismiss does not run', () => {
      const onDismiss = vi.fn();
      const card = document.createElement('article');
      card.className = 'taskCard';
      card.dataset.taskId = 'task-1';
      const inner = document.createElement('span');
      card.append(inner);
      document.body.append(card);

      renderHook(() => useDismissExpandedTaskOnOutsidePointerDown('task-1', onDismiss));

      inner.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true}));

      expect(onDismiss).not.toHaveBeenCalled();
    });
  });

  describe('Scenario: No task is expanded', () => {
    it('given null selection, when pointerdown fires, then listener is not registered and onDismiss never runs', () => {
      const onDismiss = vi.fn();
      const addSpy = vi.spyOn(document, 'addEventListener');

      renderHook(() => useDismissExpandedTaskOnOutsidePointerDown(null, onDismiss));

      expect(addSpy).not.toHaveBeenCalledWith('pointerdown', expect.any(Function), true);

      document.body.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true}));
      expect(onDismiss).not.toHaveBeenCalled();
    });
  });
});
