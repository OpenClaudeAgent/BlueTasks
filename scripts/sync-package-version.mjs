#!/usr/bin/env node
/**
 * Set the same semver on root, web/app, and server package.json (workspace monorepo).
 * Usage: node scripts/sync-package-version.mjs 0.2.0
 */
import {readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

const SEMVER =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+))?$/;

const version = process.argv[2];
if (!version || !SEMVER.test(version)) {
  console.error('Usage: node scripts/sync-package-version.mjs <semver>');
  process.exit(1);
}

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const paths = [
  join(root, 'package.json'),
  join(root, 'web/app/package.json'),
  join(root, 'server/package.json'),
];

for (const p of paths) {
  const pkg = JSON.parse(readFileSync(p, 'utf8'));
  pkg.version = version;
  writeFileSync(p, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
}

console.log(`Synced version to ${version} in ${paths.length} package.json files.`);
