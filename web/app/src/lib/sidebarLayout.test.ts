import {describe, expect, it} from 'vitest';
import {
  clampSidebarWidthPx,
  SIDEBAR_COMPACT_MAX_WIDTH_PX,
  SIDEBAR_DEFAULT_WIDTH_PX,
  SIDEBAR_MAX_WIDTH_PX,
  SIDEBAR_MIN_WIDTH_PX,
} from './sidebarLayout';

describe('Feature: Sidebar layout spec', () => {
  describe('Rule: default width stays above compact threshold', () => {
    it('Then users open the app in non-compact layout by default', () => {
      expect(SIDEBAR_DEFAULT_WIDTH_PX).toBeGreaterThan(SIDEBAR_COMPACT_MAX_WIDTH_PX);
    });
  });

  describe('Rule: clampSidebarWidthPx', () => {
    it('Scenario: width inside range — returns same integer', () => {
      expect(clampSidebarWidthPx(200)).toBe(200);
      expect(clampSidebarWidthPx(SIDEBAR_MIN_WIDTH_PX)).toBe(SIDEBAR_MIN_WIDTH_PX);
      expect(clampSidebarWidthPx(SIDEBAR_MAX_WIDTH_PX)).toBe(SIDEBAR_MAX_WIDTH_PX);
    });

    it('Scenario: width below minimum — returns min', () => {
      expect(clampSidebarWidthPx(SIDEBAR_MIN_WIDTH_PX - 1)).toBe(SIDEBAR_MIN_WIDTH_PX);
    });

    it('Scenario: width above maximum — returns max', () => {
      expect(clampSidebarWidthPx(SIDEBAR_MAX_WIDTH_PX + 1)).toBe(SIDEBAR_MAX_WIDTH_PX);
    });
  });
});
