/**
 * Single source of truth for Lexical shell embed locations (copy + CI checks).
 */
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const lexicalDistDir = path.join(repoRoot, 'web/mobile-lexical-shell/dist');

export const lexicalComposeEmbedDir = path.join(
  repoRoot,
  'mobile/composeApp/src/commonMain/composeResources/files/bluetasks_lexical',
);

export const lexicalAndroidAssetsDir = path.join(
  repoRoot,
  'mobile/composeApp/src/androidMain/assets/bluetasks_lexical',
);

export function embedIndexHtmlPaths() {
  return [
    path.join(lexicalComposeEmbedDir, 'index.html'),
    path.join(lexicalAndroidAssetsDir, 'index.html'),
  ];
}

/**
 * @param {string} html
 * @returns {string[]}
 */
export function checkEmbedHtmlInvariants(html) {
  const failures = [];
  if (html.includes('type="module"')) {
    failures.push('must not use type="module" (iOS file:// + WKWebView)');
  }
  if (html.includes('crossorigin')) {
    failures.push('must not use crossorigin (Android WebViewAssetLoader / no CORS headers)');
  }
  if (!html.includes('defer')) {
    failures.push('script must use defer (avoid blocking on large IIFE bundle)');
  }
  if (!html.includes('./assets/index.js')) {
    failures.push('expected ./assets/index.js script reference');
  }
  if (!html.includes('./assets/index.css')) {
    failures.push('expected ./assets/index.css stylesheet reference');
  }
  return failures;
}
