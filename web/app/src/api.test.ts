/** @vitest-environment jsdom */
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {areasApi, apiUrl, downloadDatabaseExport, tasksApi, uploadDatabaseImport} from './api';

describe('apiUrl', () => {
  it('returns a path rooted at / when no origin prefix applies', () => {
    const u = apiUrl('/api/tasks');
    expect(u.endsWith('/api/tasks')).toBe(true);
    expect(u).toMatch(/^(\w+:\/\/.+)?\/api\/tasks$/);
  });

  it('normalizes paths without leading slash', () => {
    expect(apiUrl('api/tasks').endsWith('/api/tasks')).toBe(true);
  });
});

describe('tasksApi / areasApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('list tasks calls GET /api/tasks and parses JSON', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([{id: '1', title: 'A'}]),
    } as Response);
    const rows = await tasksApi.list();
    expect(rows).toEqual([{id: '1', title: 'A'}]);
    expect(String(vi.mocked(fetch).mock.calls[0]?.[0])).toMatch(/\/api\/tasks$/);
    expect(vi.mocked(fetch).mock.calls[0]?.[1]).toMatchObject({
      headers: expect.objectContaining({'Content-Type': 'application/json'}),
    });
  });

  it('create sends POST with JSON body', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve({id: 'n', title: 'New'}),
    } as Response);
    const row = await tasksApi.create({title: 'New'});
    expect(row.title).toBe('New');
    const init = vi.mocked(fetch).mock.calls[0]?.[1] as RequestInit;
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({title: 'New'}));
  });

  it('update sends PUT to /api/tasks/:id', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({id: 'x', title: 'U'}),
    } as Response);
    await tasksApi.update('x', {title: 'U'} as never);
    expect(String(vi.mocked(fetch).mock.calls[0]?.[0])).toMatch(/\/api\/tasks\/x$/);
    const init = vi.mocked(fetch).mock.calls[0]?.[1] as RequestInit;
    expect(init.method).toBe('PUT');
  });

  it('remove resolves on 204 No Content', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 204,
      text: () => Promise.resolve(''),
    } as Response);
    await expect(tasksApi.remove('z')).resolves.toBeUndefined();
  });

  it('throws with response text when HTTP error', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('boom'),
    } as Response);
    await expect(tasksApi.list()).rejects.toThrow('boom');
  });

  it('areasApi.create POSTs name and optional icon', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve({id: 'a', name: 'Z', icon: 'folder'}),
    } as Response);
    await areasApi.create({name: 'Z', icon: 'inbox'});
    const init = vi.mocked(fetch).mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(init.body))).toEqual({name: 'Z', icon: 'inbox'});
  });

  it('areasApi.update sends PUT', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({id: 'a', name: 'Renamed'}),
    } as Response);
    await areasApi.update('a', {name: 'Renamed'});
    expect(String(vi.mocked(fetch).mock.calls[0]?.[0])).toMatch(/\/api\/areas\/a$/);
  });

  it('areasApi.remove sends DELETE', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 204,
      text: () => Promise.resolve(''),
    } as Response);
    await expect(areasApi.remove('a')).resolves.toBeUndefined();
  });
});

describe('uploadDatabaseImport', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('resolves on 204', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 204,
      text: () => Promise.resolve(''),
    } as Response);
    const file = new File([new Uint8Array([1, 2])], 'x.sqlite');
    await expect(uploadDatabaseImport(file)).resolves.toBeUndefined();
    const init = vi.mocked(fetch).mock.calls[0]?.[1] as RequestInit;
    expect(init.method).toBe('POST');
    expect(init.body).toBeInstanceOf(FormData);
    expect(String(vi.mocked(fetch).mock.calls[0]?.[0])).toMatch(/\/api\/import\/database$/);
  });

  it('throws JSON message when server returns JSON error', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve(JSON.stringify({message: 'bad db'})),
    } as Response);
    const file = new File([], 'x.sqlite');
    await expect(uploadDatabaseImport(file)).rejects.toThrow('bad db');
  });

  it('throws plain text when JSON parse fails', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('plain err'),
    } as Response);
    const file = new File([], 'x.sqlite');
    await expect(uploadDatabaseImport(file)).rejects.toThrow('plain err');
  });
});

describe('downloadDatabaseExport', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects when the HTTP response is an error', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('serveur'),
    } as Response);
    await expect(downloadDatabaseExport()).rejects.toThrow('serveur');
  });

  it('triggers download using the filename from Content-Disposition', async () => {
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

    expect(String(vi.mocked(fetch).mock.calls[0]?.[0])).toMatch(/\/api\/export\/database$/);
    expect(click).toHaveBeenCalled();
    expect(remove).toHaveBeenCalled();
    expect(anchor.download).toBe('export.sqlite');
  });

  it('uses default filename when Content-Disposition is missing', async () => {
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: () => 'blob:mock',
      revokeObjectURL: vi.fn(),
    });
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['x'])),
      headers: {get: () => null},
    } as Response);
    const click = vi.fn();
    const anchor = {href: '', download: '', rel: '', click, remove: vi.fn()};
    vi.spyOn(document, 'createElement').mockReturnValue(anchor as unknown as HTMLAnchorElement);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => anchor as unknown as Node);
    await downloadDatabaseExport();
    expect(anchor.download).toBe('bluetasks.sqlite');
  });
});
