/** @vitest-environment jsdom */
import {describe, expect, it, vi} from 'vitest';
import {render, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {I18nextProvider} from 'react-i18next';
import i18n from '../i18n';
import {Sidebar} from './Sidebar';
import {AREA_FILTER_ALL} from '../types';

const baseCounts = {today: 1, upcoming: 0, anytime: 2, done: 0};

describe('Feature: Sidebar', () => {
  it('Scenario: User switches section — calls onSelect with section id', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <Sidebar
          areaFilter={AREA_FILTER_ALL}
          areaRowCounts={{all: 3, uncategorized: 1, byId: {}}}
          areas={[]}
          counts={baseCounts}
          onAreaFilterChange={vi.fn()}
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

  it('Scenario: User filters by named area — calls onAreaFilterChange', async () => {
    const user = userEvent.setup();
    const onAreaFilterChange = vi.fn();
    const areas = [
      {id: 'z1', name: 'Work', icon: 'folder' as const, sortIndex: 0, createdAt: '2025-01-01T00:00:00.000Z'},
    ];
    render(
      <I18nextProvider i18n={i18n}>
        <Sidebar
          areaFilter={AREA_FILTER_ALL}
          areaRowCounts={{all: 1, uncategorized: 0, byId: {z1: 1}}}
          areas={areas}
          counts={baseCounts}
          onAreaFilterChange={onAreaFilterChange}
          onOpenSettings={vi.fn()}
          onSelect={vi.fn()}
          selectedSection="today"
        />
      </I18nextProvider>,
    );

    const group = screen.getByRole('group', {name: /areas/i});
    await user.click(within(group).getByRole('button', {name: (n) => n.startsWith('Work')}));
    expect(onAreaFilterChange).toHaveBeenCalledWith('z1');
  });

  it('Scenario: User opens settings — calls onOpenSettings', async () => {
    const user = userEvent.setup();
    const onOpenSettings = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <Sidebar
          areaFilter={AREA_FILTER_ALL}
          areaRowCounts={{all: 0, uncategorized: 0, byId: {}}}
          areas={[]}
          counts={baseCounts}
          onAreaFilterChange={vi.fn()}
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
