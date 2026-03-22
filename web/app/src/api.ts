import type {Category, CreateTaskPayload, Task, TaskDraftPayload} from './types';

/**
 * Express API base URL. Empty string = same-origin relative paths (e.g. production on :8787).
 * In `vite dev`, requests hit `/api` and the Vite proxy forwards to :8787 — same origin, no CORS,
 * and the app still works when the browser would block cross-origin calls.
 */
function apiOrigin(): string {
  const fromEnv = import.meta.env.VITE_API_ORIGIN?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }
  if (import.meta.env.DEV) {
    return '';
  }
  if (typeof window !== 'undefined' && window.location.port === '4173') {
    return `http://${window.location.hostname}:8787`;
  }
  return '';
}

export function apiUrl(path: string): string {
  const o = apiOrigin();
  const p = path.startsWith('/') ? path : `/${path}`;
  return o ? `${o}${p}` : p;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const tasksApi = {
  list(): Promise<Task[]> {
    return request<Task[]>('/api/tasks');
  },
  create(payload: CreateTaskPayload): Promise<Task> {
    return request<Task>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  update(id: string, payload: TaskDraftPayload): Promise<Task> {
    return request<Task>(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  remove(id: string): Promise<void> {
    return request<void>(`/api/tasks/${id}`, {
      method: 'DELETE',
    });
  },
};

export const categoriesApi = {
  list(): Promise<Category[]> {
    return request<Category[]>('/api/categories');
  },
  create(body: {name: string; icon?: string}): Promise<Category> {
    return request<Category>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  update(id: string, body: {name: string; icon?: string}): Promise<Category> {
    return request<Category>(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },
  remove(id: string): Promise<void> {
    return request<void>(`/api/categories/${id}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Replace the server database with an exported `.sqlite` file (multipart POST, field `database`).
 * After success, refresh task and category lists on the client.
 */
export async function uploadDatabaseImport(file: File): Promise<void> {
  const form = new FormData();
  form.append('database', file, file.name || 'bluetasks.sqlite');
  const response = await fetch(apiUrl('/api/import/database'), {
    method: 'POST',
    body: form,
  });
  if (!response.ok) {
    let message = await response.text();
    try {
      const j = JSON.parse(message) as {message?: string};
      if (j.message) {
        message = j.message;
      }
    } catch {
      /* plain text */
    }
    throw new Error(message || `HTTP ${response.status}`);
  }
}

/** Download a consistent SQLite snapshot (server-side VACUUM INTO). */
export async function downloadDatabaseExport(): Promise<void> {
  const response = await fetch(apiUrl('/api/export/database'));
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `HTTP ${response.status}`);
  }
  const blob = await response.blob();
  const cd = response.headers.get('Content-Disposition');
  let filename = 'bluetasks.sqlite';
  const m = cd?.match(/filename="([^"]+)"/);
  if (m?.[1]) {
    filename = m[1];
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
