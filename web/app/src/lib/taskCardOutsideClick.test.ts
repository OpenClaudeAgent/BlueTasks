/** @vitest-environment jsdom */
import {describe, expect, it} from 'vitest';
import {
  TASK_CARD_PORTAL_CLICK_ROOT_SELECTOR,
  pointerDownShouldCollapseExpandedTask,
} from './taskCardOutsideClick';

describe('Feature: Collapse expanded task when clicking outside the card', () => {
  describe('Scenario: Nothing is expanded', () => {
    it('given no selected task, when pointer target is outside, then do not collapse', () => {
      const outside = document.createElement('div');
      expect(
        pointerDownShouldCollapseExpandedTask({
          selectedTaskId: null,
          target: outside,
          expandedTaskCard: null,
        }),
      ).toBe(false);
    });
  });

  describe('Scenario: User clicks outside the expanded task card', () => {
    it('given an expanded card in the DOM, when pointerdown is on a sibling element, then collapse', () => {
      const card = document.createElement('article');
      card.className = 'taskCard';
      card.dataset.taskId = 'a';
      const outside = document.createElement('main');
      document.body.append(card, outside);

      expect(
        pointerDownShouldCollapseExpandedTask({
          selectedTaskId: 'a',
          target: outside,
          expandedTaskCard: card,
        }),
      ).toBe(true);
    });
  });

  describe('Scenario: User clicks inside the expanded task card', () => {
    it('given an expanded card, when pointerdown is on a child, then do not collapse', () => {
      const card = document.createElement('article');
      card.className = 'taskCard';
      const inner = document.createElement('button');
      card.append(inner);
      document.body.append(card);

      expect(
        pointerDownShouldCollapseExpandedTask({
          selectedTaskId: 'a',
          target: inner,
          expandedTaskCard: card,
        }),
      ).toBe(false);
    });
  });

  describe('Scenario: User clicks a different task row while one is expanded', () => {
    it('given task A expanded, when pointerdown is on task B row, then do not collapse via outside handler', () => {
      const cardA = document.createElement('article');
      cardA.className = 'taskCard';
      cardA.dataset.taskId = 'a';
      const cardB = document.createElement('article');
      cardB.className = 'taskCard';
      cardB.dataset.taskId = 'b';
      const titleB = document.createElement('button');
      titleB.textContent = 'Other task';
      cardB.append(titleB);
      document.body.append(cardA, cardB);

      expect(
        pointerDownShouldCollapseExpandedTask({
          selectedTaskId: 'a',
          target: titleB,
          expandedTaskCard: cardA,
        }),
      ).toBe(false);
    });
  });

  describe('Scenario: User interacts with a portaled picker from the card', () => {
    it('given an expanded card, when pointerdown is inside a date popover, then do not collapse', () => {
      const card = document.createElement('article');
      card.className = 'taskCard';
      const popover = document.createElement('div');
      popover.className = 'datePopover';
      const dayBtn = document.createElement('button');
      popover.append(dayBtn);
      document.body.append(card, popover);

      expect(
        pointerDownShouldCollapseExpandedTask({
          selectedTaskId: 'a',
          target: dayBtn,
          expandedTaskCard: card,
        }),
      ).toBe(false);
    });

    it('given an expanded card, when pointerdown is inside a footer popover, then do not collapse', () => {
      const card = document.createElement('article');
      card.className = 'taskCard';
      const popover = document.createElement('div');
      popover.className = 'footerPopover';
      const option = document.createElement('button');
      popover.append(option);
      document.body.append(card, popover);

      expect(
        pointerDownShouldCollapseExpandedTask({
          selectedTaskId: 'a',
          target: option,
          expandedTaskCard: card,
        }),
      ).toBe(false);
    });

    it('given an expanded card, when pointerdown is on delete dialog overlay, then do not collapse', () => {
      const card = document.createElement('article');
      card.className = 'taskCard';
      const overlay = document.createElement('div');
      overlay.className = 'confirmDialog__overlay';
      document.body.append(card, overlay);

      expect(
        pointerDownShouldCollapseExpandedTask({
          selectedTaskId: 'a',
          target: overlay,
          expandedTaskCard: card,
        }),
      ).toBe(false);
    });
  });

  describe('Scenario: Expanded card node is missing', () => {
    it('given selected id but no matching card element, when pointer is outside, then do not collapse', () => {
      const outside = document.createElement('div');
      document.body.append(outside);

      expect(
        pointerDownShouldCollapseExpandedTask({
          selectedTaskId: 'missing',
          target: outside,
          expandedTaskCard: null,
        }),
      ).toBe(false);
    });
  });

  it('portal selector lists every task-card popover/dialog surface class', () => {
    expect(TASK_CARD_PORTAL_CLICK_ROOT_SELECTOR).toContain('datePopover');
    expect(TASK_CARD_PORTAL_CLICK_ROOT_SELECTOR).toContain('footerPopover');
    expect(TASK_CARD_PORTAL_CLICK_ROOT_SELECTOR).toContain('confirmDialog__overlay');
    expect(TASK_CARD_PORTAL_CLICK_ROOT_SELECTOR).toContain('confirmDialog__content');
  });
});
