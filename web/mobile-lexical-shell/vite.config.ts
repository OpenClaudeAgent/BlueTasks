import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import type {Plugin} from 'vite';
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * - Strip `type="module"`: WKWebView often does not run ES modules from file:// (iOS).
 * - Use `defer`: classic scripts in <head> otherwise block on a ~9MB bundle (Android ANR / blank).
 * - Strip `crossorigin`: with WebViewAssetLoader (https://appassets.androidplatform.net) responses
 *   typically lack CORS headers, so crossorigin scripts/styles fail to load on Android.
 */
function lexicalShellEmbeddedWebViewPlugin(): Plugin {
  return {
    name: 'lexical-shell-embedded-webview',
    closeBundle() {
      const htmlPath = path.join(__dirname, 'dist/index.html');
      let html = fs.readFileSync(htmlPath, 'utf8');
      html = html.replaceAll('<script type="module"', '<script defer');
      html = html.replaceAll(' crossorigin', '');
      if (html.includes('<script src="./assets/index.js"') && !html.includes('<script defer')) {
        html = html.replace('<script src="./assets/index.js"', '<script defer src="./assets/index.js"');
      }
      fs.writeFileSync(htmlPath, html);
    },
  };
}

const appSrc = path.resolve(__dirname, '../app/src');
const contractRoot = path.resolve(__dirname, '../../contract');
const serverDataRoot = path.resolve(__dirname, '../../server/data');

export default defineConfig({
  plugins: [react(), lexicalShellEmbeddedWebViewPlugin()],
  base: './',
  resolve: {
    alias: {
      '@app': appSrc,
      '@bluetasks/contract': contractRoot,
      '@bluetasks/server-data': serverDataRoot,
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    /** Single IIFE bundle: WKWebView often fails to run `type="module"` from file:// (iOS). */
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        format: 'iife',
        name: 'BlueTasksLexicalShell',
        inlineDynamicImports: true,
        entryFileNames: 'assets/index.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: (info) => {
          const n = info.names[0] ?? '';
          if (n.endsWith('.css')) {
            return 'assets/index.css';
          }
          return 'assets/[name][extname]';
        },
      },
    },
    target: 'es2020',
  },
});
