/** @vitest-environment jsdom */
import {describe, expect, it, vi} from 'vitest';
import {render, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {I18nextProvider} from 'react-i18next';
import i18n from '../i18n';
import {Sidebar} from './Sidebar';
import {CATEGORY_FILTER_ALL, CATEGORY_FILTER_UNCATEGORIZED} from '../types';

const baseCounts = {all: 3, today: 1, upcoming: 0, anytime: 2, done: 0};

const resizeProps = {
  sidebarWidth: 248,
  minSidebarWidth: 200,
  maxSidebarWidth: 480,
  onResizePointerDown: vi.fn(),
} as const;

describe('Feature: Sidebar', () => {
  it('Scenario: User switches section — calls onSelect with section id', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <Sidebar
          {...resizeProps}
          categoryFilter={CATEGORY_FILTER_ALL}
          categoryRowCounts={{all: 3, uncategorized: 1, byId: {}}}
          categories={[]}
          counts={baseCounts}
          onCategoryFilterChange={vi.fn()}
          onOpenSettings={vi.fn()}
          onSelect={onSelect}
          selectedSection="today"
        />
      </I18nextProvider>,
    );

    const nav = screen.getByRole('navigation', {name: /primary navigation/i});
    await user.click(within(nav).getByRole('button', {name: (n) => n.startsWith('Anytime')}));
    expect(onSelect).toHaveBeenCalledWith('anytime');
  });

  it('Scenario: User selects All section — calls onSelect with all', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <Sidebar
          {...resizeProps}
          categoryFilter={CATEGORY_FILTER_ALL}
          categoryRowCounts={{all: 3, uncategorized: 1, byId: {}}}
          categories={[]}
          counts={baseCounts}
          onCategoryFilterChange={vi.fn()}
          onOpenSettings={vi.fn()}
          onSelect={onSelect}
          selectedSection="today"
        />
      </I18nextProvider>,
    );

    const nav = screen.getByRole('navigation', {name: /primary navigation/i});
    await user.click(within(nav).getByRole('button', {name: (n) => n.startsWith('All')}));
    expect(onSelect).toHaveBeenCalledWith('all');
  });

  it('Scenario: User filters by named category — calls onCategoryFilterChange', async () => {
    const user = userEvent.setup();
    const onCategoryFilterChange = vi.fn();
    const categories = [
      {
        id: 'z1',
        name: 'Work',
        icon: 'folder' as const,
        sortIndex: 0,
        createdAt: '2025-01-01T00:00:00.000Z',
      },
    ];
    render(
      <I18nextProvider i18n={i18n}>
        <Sidebar
          {...resizeProps}
          categoryFilter={CATEGORY_FILTER_ALL}
          categoryRowCounts={{all: 1, uncategorized: 0, byId: {z1: 1}}}
          categories={categories}
          counts={baseCounts}
          onCategoryFilterChange={onCategoryFilterChange}
          onOpenSettings={vi.fn()}
          onSelect={vi.fn()}
          selectedSection="today"
        />
      </I18nextProvider>,
    );

    const group = screen.getByRole('group', {name: /categories/i});
    await user.click(within(group).getByRole('button', {name: (n) => n.startsWith('Work')}));
    expect(onCategoryFilterChange).toHaveBeenCalledWith('z1');
  });

  it('Scenario: User filters all categories — calls onCategoryFilterChange with ALL', async () => {
    const user = userEvent.setup();
    const onCategoryFilterChange = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <Sidebar
          {...resizeProps}
          categoryFilter={CATEGORY_FILTER_UNCATEGORIZED}
          categoryRowCounts={{all: 2, uncategorized: 1, byId: {}}}
          categories={[]}
          counts={baseCounts}
          onCategoryFilterChange={onCategoryFilterChange}
          onOpenSettings={vi.fn()}
          onSelect={vi.fn()}
          selectedSection="today"
        />
      </I18nextProvider>,
    );
    const group = screen.getByRole('group', {name: /categories/i});
    await user.click(within(group).getByRole('button', {name: (n) => n.startsWith('All categories')}));
    expect(onCategoryFilterChange).toHaveBeenCalledWith(CATEGORY_FILTER_ALL);
  });

  it('Scenario: User filters unassigned — calls onCategoryFilterChange with UNCATEGORIZED', async () => {
    const user = userEvent.setup();
    const onCategoryFilterChange = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <Sidebar
          {...resizeProps}
          categoryFilter={CATEGORY_FILTER_ALL}
          categoryRowCounts={{all: 2, uncategorized: 1, byId: {}}}
          categories={[]}
          counts={baseCounts}
          onCategoryFilterChange={onCategoryFilterChange}
          onOpenSettings={vi.fn()}
          onSelect={vi.fn()}
          selectedSection="today"
        />
      </I18nextProvider>,
    );
    const group = screen.getByRole('group', {name: /categories/i});
    await user.click(within(group).getByRole('button', {name: (n) => n.startsWith('Unassigned')}));
    expect(onCategoryFilterChange).toHaveBeenCalledWith(CATEGORY_FILTER_UNCATEGORIZED);
  });

  it('Scenario: User opens settings — calls onOpenSettings', async () => {
    const user = userEvent.setup();
    const onOpenSettings = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <Sidebar
          {...resizeProps}
          categoryFilter={CATEGORY_FILTER_ALL}
          categoryRowCounts={{all: 0, uncategorized: 0, byId: {}}}
          categories={[]}
          counts={baseCounts}
          onCategoryFilterChange={vi.fn()}
          onOpenSettings={onOpenSettings}
          onSelect={vi.fn()}
          selectedSection="today"
        />
      </I18nextProvider>,
    );

    await user.click(screen.getByRole('button', {name: 'Settings'}));
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });
});
