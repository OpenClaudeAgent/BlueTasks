import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const contractRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../contract');

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@bluetasks/contract': contractRoot,
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
  /** Sans ce proxy, `vite preview` renvoie « Cannot GET /api/… » au lieu du backend. */
  preview: {
    port: 4173,
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
});
