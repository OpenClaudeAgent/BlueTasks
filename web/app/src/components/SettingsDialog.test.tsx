/** @vitest-environment jsdom */
import {describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {I18nextProvider} from 'react-i18next';
import i18n from '../i18n';
import {SettingsDialog} from './SettingsDialog';

const areasCreateMock = vi.fn().mockResolvedValue({
  id: 'new-area',
  name: 'Alpha',
  icon: 'folder',
  sortIndex: 0,
  createdAt: '2025-01-01T00:00:00.000Z',
});

vi.mock('../api', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../api')>();
  return {
    ...mod,
    downloadDatabaseExport: vi.fn().mockResolvedValue(undefined),
    uploadDatabaseImport: vi.fn().mockResolvedValue(undefined),
    areasApi: {
      ...mod.areasApi,
      create: (...args: unknown[]) => areasCreateMock(...args),
    },
  };
});

function renderDialog() {
  return render(
    <I18nextProvider i18n={i18n}>
      <SettingsDialog
        areas={[]}
        onAreasUpdated={async () => {}}
        onOpenChange={() => {}}
        open
        taskCountByAreaId={{}}
      />
    </I18nextProvider>,
  );
}

describe('SettingsDialog', () => {
  it('shows SQLite export and import buttons on the General tab', async () => {
    const user = userEvent.setup();
    renderDialog();

    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', {name: /general/i}));

    expect(
      screen.getByRole('button', {name: /export sqlite database/i}),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {name: /import sqlite database/i}),
    ).toBeInTheDocument();
  });

  it('Scenario: Areas tab — user adds an area and areasApi.create is called', async () => {
    const user = userEvent.setup();
    const onAreasUpdated = vi.fn().mockResolvedValue(undefined);
    render(
      <I18nextProvider i18n={i18n}>
        <SettingsDialog
          areas={[]}
          onAreasUpdated={onAreasUpdated}
          onOpenChange={() => {}}
          open
          taskCountByAreaId={{}}
        />
      </I18nextProvider>,
    );

    await screen.findByRole('dialog');
    await user.type(screen.getByPlaceholderText(/new area name/i), 'Alpha');
    await user.click(screen.getByRole('button', {name: /^Add$/i}));
    expect(areasCreateMock).toHaveBeenCalledWith({name: 'Alpha', icon: 'folder'});
    await expect.poll(() => onAreasUpdated.mock.calls.length).toBeGreaterThan(0);
  });
});
