import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const contractRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../contract');
const serverDataRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../server/data');

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@bluetasks/contract': contractRoot,
      '@bluetasks/server-data': serverDataRoot,
    },
  },
  server: {
    port: 5173,
    /* Use 127.0.0.1 so the proxy matches IPv4 listen; `localhost` → ::1 can cause 502. */
    proxy: {
      '/api': 'http://127.0.0.1:8787',
    },
  },
  /** Without this proxy, `vite preview` serves "Cannot GET /api/…" instead of the API. */
  preview: {
    port: 4173,
    proxy: {
      '/api': 'http://127.0.0.1:8787',
    },
  },
});
