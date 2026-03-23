#!/usr/bin/env node
/**
 * Copies web/mobile-lexical-shell/dist into Android assets and Compose multiplatform resources.
 * Run: npm run build:mobile-lexical
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'web/mobile-lexical-shell/dist');
const androidDest = path.join(root, 'mobile/composeApp/src/androidMain/assets/bluetasks_lexical');
const composeDest = path.join(
  root,
  'mobile/composeApp/src/commonMain/composeResources/files/bluetasks_lexical',
);

if (!fs.existsSync(dist)) {
  console.error('Missing dist. Run: npm run build --workspace @bluetasks/mobile-lexical-shell');
  process.exit(1);
}

function syncDir(to) {
  fs.rmSync(to, {recursive: true, force: true});
  fs.mkdirSync(to, {recursive: true});
  for (const name of fs.readdirSync(dist)) {
    fs.cpSync(path.join(dist, name), path.join(to, name), {recursive: true});
  }
}

syncDir(androidDest);
syncDir(composeDest);
console.log('Lexical shell copied to:\n ', androidDest, '\n ', composeDest);
