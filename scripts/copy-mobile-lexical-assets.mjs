#!/usr/bin/env node
/**
 * Copies web/mobile-lexical-shell/dist into Android assets and Compose multiplatform resources.
 * Run: npm run build:mobile-lexical
 */
import fs from 'node:fs';
import path from 'node:path';
import {checkEmbedHtmlInvariants, lexicalAndroidAssetsDir, lexicalComposeEmbedDir, lexicalDistDir} from './mobile-lexical-embed-paths.mjs';

const dist = lexicalDistDir;

if (!fs.existsSync(dist)) {
  console.error('Missing dist. Run: npm run build --workspace @bluetasks/mobile-lexical-shell');
  process.exit(1);
}

const distHtml = path.join(dist, 'index.html');
if (!fs.existsSync(distHtml)) {
  console.error('Missing', distHtml);
  process.exit(1);
}
const distFailures = checkEmbedHtmlInvariants(fs.readFileSync(distHtml, 'utf8'));
if (distFailures.length) {
  console.error('dist/index.html failed embed invariants (fix Vite plugin / build):');
  for (const f of distFailures) {
    console.error(' -', f);
  }
  process.exit(1);
}

function syncDir(to) {
  fs.rmSync(to, {recursive: true, force: true});
  fs.mkdirSync(to, {recursive: true});
  for (const name of fs.readdirSync(dist)) {
    fs.cpSync(path.join(dist, name), path.join(to, name), {recursive: true});
  }
}

syncDir(lexicalAndroidAssetsDir);
syncDir(lexicalComposeEmbedDir);
console.log('Lexical shell copied to:\n ', lexicalAndroidAssetsDir, '\n ', lexicalComposeEmbedDir);
