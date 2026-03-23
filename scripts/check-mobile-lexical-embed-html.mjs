#!/usr/bin/env node
/**
 * Guards embedded Lexical shell HTML after copy (Compose + Android assets must match invariants).
 */
import fs from 'node:fs';
import {checkEmbedHtmlInvariants, embedIndexHtmlPaths} from './mobile-lexical-embed-paths.mjs';

const paths = embedIndexHtmlPaths();
let hadError = false;

for (const htmlPath of paths) {
  if (!fs.existsSync(htmlPath)) {
    console.error('Missing:', htmlPath, '\nRun: npm run build:mobile-lexical');
    hadError = true;
    continue;
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  const failures = checkEmbedHtmlInvariants(html);
  if (failures.length) {
    console.error('check-mobile-lexical-embed-html failed:', htmlPath);
    for (const f of failures) {
      console.error(' -', f);
    }
    hadError = true;
  } else {
    console.log('OK:', htmlPath);
  }
}

if (hadError) {
  process.exit(1);
}
