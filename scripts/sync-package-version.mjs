#!/usr/bin/env node
/**
 * Set the same semver on root, web/app, server, desktop package.json, Tauri config, and Cargo.toml.
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
const jsonPaths = [
  join(root, 'package.json'),
  join(root, 'web/app/package.json'),
  join(root, 'server/package.json'),
  join(root, 'desktop/package.json'),
];

for (const p of jsonPaths) {
  const pkg = JSON.parse(readFileSync(p, 'utf8'));
  pkg.version = version;
  writeFileSync(p, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
}

const tauriConfPath = join(root, 'desktop/src-tauri/tauri.conf.json');
const tauriConf = JSON.parse(readFileSync(tauriConfPath, 'utf8'));
tauriConf.version = version;
writeFileSync(tauriConfPath, `${JSON.stringify(tauriConf, null, 2)}\n`, 'utf8');

const cargoPath = join(root, 'desktop/src-tauri/Cargo.toml');
const cargoLines = readFileSync(cargoPath, 'utf8').split('\n');
const pkgIdx = cargoLines.findIndex((l) => l.trim() === '[package]');
if (pkgIdx === -1) {
  console.error('sync-package-version: [package] not found in Cargo.toml');
  process.exit(1);
}
let updatedCargo = false;
for (let i = pkgIdx + 1; i < cargoLines.length; i++) {
  const line = cargoLines[i];
  if (/^\s*\[/.test(line)) {
    break;
  }
  if (/^version\s*=\s*"/.test(line)) {
    cargoLines[i] = `version = "${version}"`;
    updatedCargo = true;
    break;
  }
}
if (!updatedCargo) {
  console.error('sync-package-version: version key not found in [package]');
  process.exit(1);
}
writeFileSync(cargoPath, cargoLines.join('\n'), 'utf8');

console.log(
  `Synced version to ${version} in ${jsonPaths.length} package.json, tauri.conf.json, and Cargo.toml.`,
);
