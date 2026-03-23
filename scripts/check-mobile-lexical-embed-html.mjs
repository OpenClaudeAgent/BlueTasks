#!/usr/bin/env node
/**
 * Guards the embedded Lexical shell HTML copied into Compose resources.
 * Android WebViewAssetLoader breaks on crossorigin; iOS WKWebView breaks on type=module + file://.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = path.join(
  root,
  'mobile/composeApp/src/commonMain/composeResources/files/bluetasks_lexical/index.html',
);

if (!fs.existsSync(htmlPath)) {
  console.error('Missing:', htmlPath, '\nRun: npm run build:mobile-lexical');
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf8');

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

if (failures.length) {
  console.error('check-mobile-lexical-embed-html failed:');
  for (const f of failures) {
    console.error(' -', f);
  }
  process.exit(1);
}

console.log('OK:', htmlPath);
