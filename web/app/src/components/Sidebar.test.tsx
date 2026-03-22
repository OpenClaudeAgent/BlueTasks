/** @vitest-environment jsdom */
import {describe, expect, it, vi} from 'vitest';
import {render, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {I18nextProvider} from 'react-i18next';
import i18n from '../i18n';
import {SIDEBAR_COMPACT_MAX_WIDTH_PX, SIDEBAR_DEFAULT_WIDTH_PX} from '../lib/sidebarLayout';
import {Sidebar} from './Sidebar';
import {CATEGORY_FILTER_ALL, CATEGORY_FILTER_UNCATEGORIZED} from '../types';

const baseCounts = {all: 3, today: 1, upcoming: 0, anytime: 2, done: 0};

function sidebarHandlers() {
  return {
    onSelect: vi.fn(),
    onCategoryFilterChange: vi.fn(),
    onOpenSettings: vi.fn(),
  };
}

type SidebarExtras = {
  categoryFilter: typeof CATEGORY_FILTER_ALL | typeof CATEGORY_FILTER_UNCATEGORIZED;
  categoryRowCounts: {all: number; uncategorized: number; byId: Record<string, number>};
  categories: Array<{
    id: string;
    name: string;
    icon: 'folder';
    sortIndex: number;
    createdAt: string;
  }>;
  selectedSection: 'today';
};

const defaultExtras: SidebarExtras = {
  categoryFilter: CATEGORY_FILTER_ALL,
  categoryRowCounts: {all: 3, uncategorized: 1, byId: {}},
  categories: [],
  selectedSection: 'today',
};

function mountSidebar(
  ui: Partial<SidebarExtras> & {sidebarWidth?: number},
  handlers = sidebarHandlers(),
) {
  const {sidebarWidth = SIDEBAR_DEFAULT_WIDTH_PX, ...rest} = ui;
  const merged = {...defaultExtras, ...rest};
  render(
    <I18nextProvider i18n={i18n}>
      <Sidebar
        sidebarWidth={sidebarWidth}
        categoryFilter={merged.categoryFilter}
        categoryRowCounts={merged.categoryRowCounts}
        categories={merged.categories}
        counts={baseCounts}
        onCategoryFilterChange={handlers.onCategoryFilterChange}
        onOpenSettings={handlers.onOpenSettings}
        onSelect={handlers.onSelect}
        selectedSection={merged.selectedSection}
      />
    </I18nextProvider>,
  );
  return handlers;
}

describe('Feature: Sidebar', () => {
  describe('Rule: section navigation', () => {
    it('Scenario: user switches section — calls onSelect once with section id', async () => {
      const user = userEvent.setup();
      const {onSelect} = mountSidebar({});
      const nav = screen.getByRole('navigation', {name: /primary navigation/i});
      await user.click(within(nav).getByRole('button', {name: (n) => n.startsWith('Anytime')}));
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith('anytime');
    });

    it('Scenario: user selects All — calls onSelect once with "all"', async () => {
      const user = userEvent.setup();
      const {onSelect} = mountSidebar({});
      const nav = screen.getByRole('navigation', {name: /primary navigation/i});
      await user.click(within(nav).getByRole('button', {name: (n) => n.startsWith('All')}));
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith('all');
    });
  });

  describe('Rule: category filter', () => {
    it('Scenario: user picks a named category — calls onCategoryFilterChange once with id', async () => {
      const user = userEvent.setup();
      const categories = [
        {
          id: 'z1',
          name: 'Work',
          icon: 'folder' as const,
          sortIndex: 0,
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      ];
      const {onCategoryFilterChange} = mountSidebar({
        categoryRowCounts: {all: 1, uncategorized: 0, byId: {z1: 1}},
        categories,
      });
      const group = screen.getByRole('group', {name: /categories/i});
      await user.click(within(group).getByRole('button', {name: (n) => n.startsWith('Work')}));
      expect(onCategoryFilterChange).toHaveBeenCalledTimes(1);
      expect(onCategoryFilterChange).toHaveBeenCalledWith('z1');
    });

    it('Scenario: user chooses all categories — sends ALL filter', async () => {
      const user = userEvent.setup();
      const {onCategoryFilterChange} = mountSidebar({
        categoryFilter: CATEGORY_FILTER_UNCATEGORIZED,
        categoryRowCounts: {all: 2, uncategorized: 1, byId: {}},
      });
      const group = screen.getByRole('group', {name: /categories/i});
      await user.click(
        within(group).getByRole('button', {name: (n) => n.startsWith('All categories')}),
      );
      expect(onCategoryFilterChange).toHaveBeenCalledTimes(1);
      expect(onCategoryFilterChange).toHaveBeenCalledWith(CATEGORY_FILTER_ALL);
    });

    it('Scenario: user chooses unassigned — sends UNCATEGORIZED filter', async () => {
      const user = userEvent.setup();
      const {onCategoryFilterChange} = mountSidebar({
        categoryRowCounts: {all: 2, uncategorized: 1, byId: {}},
      });
      const group = screen.getByRole('group', {name: /categories/i});
      await user.click(
        within(group).getByRole('button', {name: (n) => n.startsWith('Unassigned')}),
      );
      expect(onCategoryFilterChange).toHaveBeenCalledTimes(1);
      expect(onCategoryFilterChange).toHaveBeenCalledWith(CATEGORY_FILTER_UNCATEGORIZED);
    });
  });

  describe('Rule: settings entry', () => {
    it('Scenario: user opens settings — onOpenSettings called exactly once', async () => {
      const user = userEvent.setup();
      const {onOpenSettings} = mountSidebar({
        categoryRowCounts: {all: 0, uncategorized: 0, byId: {}},
      });
      await user.click(screen.getByRole('button', {name: 'Settings'}));
      expect(onOpenSettings).toHaveBeenCalledTimes(1);
    });
  });

  describe('Rule: compact layout', () => {
    it('Scenario: width one pixel above threshold — not compact', () => {
      mountSidebar({sidebarWidth: SIDEBAR_COMPACT_MAX_WIDTH_PX + 1});
      expect(screen.getByRole('complementary')).not.toHaveClass('sidebar--compact');
    });

    it('Scenario: width at or below threshold — compact', () => {
      mountSidebar({sidebarWidth: SIDEBAR_COMPACT_MAX_WIDTH_PX});
      expect(screen.getByRole('complementary')).toHaveClass('sidebar--compact');
    });
  });
});
