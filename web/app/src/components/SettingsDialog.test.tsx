/** @vitest-environment jsdom */
import {describe, expect, it, vi, beforeEach, afterEach} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {I18nextProvider} from 'react-i18next';
import i18n from '../i18n';
import {downloadDatabaseExport, uploadDatabaseImport} from '../api';
import {SettingsDialog} from './SettingsDialog';
import type {Area} from '../types';

const areasCreateMock = vi.fn();
const areasUpdateMock = vi.fn();
const areasRemoveMock = vi.fn();

vi.mock('../api', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../api')>();
  return {
    ...mod,
    downloadDatabaseExport: vi.fn().mockResolvedValue(undefined),
    uploadDatabaseImport: vi.fn().mockResolvedValue(undefined),
    areasApi: {
      ...mod.areasApi,
      create: (...args: unknown[]) => areasCreateMock(...args),
      update: (...args: unknown[]) => areasUpdateMock(...args),
      remove: (...args: unknown[]) => areasRemoveMock(...args),
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

const sampleArea: Area = {
  id: 'area-1',
  name: 'Work',
  icon: 'folder',
  sortIndex: 0,
  createdAt: '2025-01-01T00:00:00.000Z',
};

describe('SettingsDialog', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
    areasCreateMock.mockResolvedValue({
      id: 'new-area',
      name: 'Alpha',
      icon: 'folder',
      sortIndex: 0,
      createdAt: '2025-01-01T00:00:00.000Z',
    });
    areasUpdateMock.mockResolvedValue({...sampleArea, name: 'Renamed'});
    areasRemoveMock.mockResolvedValue(undefined);
    vi.mocked(downloadDatabaseExport).mockResolvedValue(undefined);
    vi.mocked(uploadDatabaseImport).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

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

  it('Scenario: General — user exports database and download runs', async () => {
    const user = userEvent.setup();
    renderDialog();
    await screen.findByRole('dialog');
    await user.click(screen.getByRole('button', {name: /general/i}));
    await user.click(screen.getByRole('button', {name: /export sqlite database/i}));
    expect(downloadDatabaseExport).toHaveBeenCalledTimes(1);
  });

  it('Scenario: General — export failure shows alert', async () => {
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.mocked(downloadDatabaseExport).mockRejectedValueOnce(new Error('fail'));
    renderDialog();
    await screen.findByRole('dialog');
    await user.click(screen.getByRole('button', {name: /general/i}));
    await user.click(screen.getByRole('button', {name: /export sqlite database/i}));
    await expect.poll(() => alertSpy.mock.calls.length).toBeGreaterThan(0);
  });

  it('Scenario: General — user imports file after confirm', async () => {
    const user = userEvent.setup();
    const onAreasUpdated = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
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
    await user.click(screen.getByRole('button', {name: /general/i}));
    const input = document.body.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeTruthy();
    const file = new File(['x'], 'backup.sqlite', {type: 'application/octet-stream'});
    await user.upload(input, file);
    expect(uploadDatabaseImport).toHaveBeenCalledWith(file);
    await expect.poll(() => onAreasUpdated.mock.calls.length).toBeGreaterThan(0);
  });

  it('Scenario: General — import cancelled when user declines confirm', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(
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
    await screen.findByRole('dialog');
    await user.click(screen.getByRole('button', {name: /general/i}));
    const input = document.body.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeTruthy();
    await user.upload(input, new File(['x'], 'b.sqlite'));
    expect(uploadDatabaseImport).not.toHaveBeenCalled();
  });

  it('Scenario: Areas — user renames an area and update is called', async () => {
    const user = userEvent.setup();
    const onAreasUpdated = vi.fn().mockResolvedValue(undefined);
    render(
      <I18nextProvider i18n={i18n}>
        <SettingsDialog
          areas={[sampleArea]}
          onAreasUpdated={onAreasUpdated}
          onOpenChange={() => {}}
          open
          taskCountByAreaId={{[sampleArea.id]: 0}}
        />
      </I18nextProvider>,
    );
    await screen.findByRole('dialog');
    await user.click(screen.getByRole('button', {name: /rename area/i}));
    const nameInput = screen.getByDisplayValue('Work');
    await user.clear(nameInput);
    await user.type(nameInput, 'Renamed');
    await user.click(screen.getByRole('button', {name: /^Save$/i}));
    expect(areasUpdateMock).toHaveBeenCalledWith(sampleArea.id, {name: 'Renamed', icon: 'folder'});
  });

  it('Scenario: Areas — user deletes empty area after confirm', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const onAreasUpdated = vi.fn().mockResolvedValue(undefined);
    render(
      <I18nextProvider i18n={i18n}>
        <SettingsDialog
          areas={[sampleArea]}
          onAreasUpdated={onAreasUpdated}
          onOpenChange={() => {}}
          open
          taskCountByAreaId={{[sampleArea.id]: 0}}
        />
      </I18nextProvider>,
    );
    await screen.findByRole('dialog');
    await user.click(screen.getByRole('button', {name: 'Delete'}));
    expect(areasRemoveMock).toHaveBeenCalledWith(sampleArea.id);
  });

  it('Scenario: Areas — user adds area with Enter in name field', async () => {
    const user = userEvent.setup();
    render(
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
    await screen.findByRole('dialog');
    const field = screen.getByPlaceholderText(/new area name/i);
    await user.type(field, 'Beta{enter}');
    expect(areasCreateMock).toHaveBeenCalledWith({name: 'Beta', icon: 'folder'});
  });

  it('Scenario: Areas — edit mode Escape closes editor', async () => {
    const user = userEvent.setup();
    render(
      <I18nextProvider i18n={i18n}>
        <SettingsDialog
          areas={[sampleArea]}
          onAreasUpdated={async () => {}}
          onOpenChange={() => {}}
          open
          taskCountByAreaId={{[sampleArea.id]: 1}}
        />
      </I18nextProvider>,
    );
    await screen.findByRole('dialog');
    await user.click(screen.getByRole('button', {name: /rename area/i}));
    await user.keyboard('{Escape}');
    expect(screen.queryByDisplayValue('Work')).not.toBeInTheDocument();
    expect(screen.getByText('Work')).toBeInTheDocument();
  });
});
