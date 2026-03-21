/** @vitest-environment jsdom */
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {downloadDatabaseExport} from './api';

describe('downloadDatabaseExport', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejette quand la réponse HTTP est en erreur', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('serveur'),
    } as Response);
    await expect(downloadDatabaseExport()).rejects.toThrow('serveur');
  });

  it('déclenche le téléchargement avec le nom issu du Content-Disposition', async () => {
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: () => 'blob:mock',
      revokeObjectURL: vi.fn(),
    });
    const blob = new Blob(['sqlite']);
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(blob),
      headers: {
        get: (name: string) =>
          name.toLowerCase() === 'content-disposition'
            ? 'attachment; filename="export.sqlite"'
            : null,
      },
    } as Response);

    const click = vi.fn();
    const remove = vi.fn();
    const anchor = {href: '', download: '', rel: '', click, remove};
    vi.spyOn(document, 'createElement').mockReturnValue(anchor as unknown as HTMLAnchorElement);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => anchor as unknown as Node);

    await downloadDatabaseExport();

    expect(fetch).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(remove).toHaveBeenCalled();
    expect(anchor.download).toBe('export.sqlite');
  });
});
