#!/usr/bin/env node
/**
 * Assembles `desktop/src-tauri/resources/bluetasks-runtime/` with the same layout as the
 * Docker image: CJS server bundle, Vite dist, server/data (area icon ids), and pruned node_modules for the
 * current platform (better-sqlite3 native build).
 *
 * Prerequisites: `npm run build` (server/dist + web/app/dist).
 * Uses an isolated `.desktopctx/` tree and `npm ci --omit=dev -w @bluetasks/server`.
 */
import {cpSync, existsSync, mkdirSync, rmSync} from 'node:fs';
import {execSync} from 'node:child_process';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ctx = join(root, '.desktopctx');
const out = join(root, 'desktop', 'src-tauri', 'resources', 'bluetasks-runtime');

const serverDist = join(root, 'server', 'dist', 'index.js');
const webDist = join(root, 'web', 'app', 'dist');

if (!existsSync(serverDist)) {
  console.error('error: server/dist/index.js is missing — run `npm run build` first.');
  process.exit(1);
}
if (!existsSync(webDist)) {
  console.error('error: web/app/dist is missing — run `npm run build` first.');
  process.exit(1);
}

rmSync(ctx, {recursive: true, force: true});
mkdirSync(join(ctx, 'server'), {recursive: true});
mkdirSync(join(ctx, 'web', 'app'), {recursive: true});

for (const [from, to] of [
  [join(root, 'package.json'), join(ctx, 'package.json')],
  [join(root, 'package-lock.json'), join(ctx, 'package-lock.json')],
  [join(root, 'server', 'package.json'), join(ctx, 'server', 'package.json')],
  [join(root, 'web', 'app', 'package.json'), join(ctx, 'web', 'app', 'package.json')],
]) {
  cpSync(from, to);
}

cpSync(join(root, 'scripts', 'docker-prune-native-deps.mjs'), join(ctx, 'docker-prune-native-deps.mjs'));

console.log('[desktop-runtime] npm ci (production, server workspace) in .desktopctx/ …');
execSync('npm ci --omit=dev -w @bluetasks/server', {cwd: ctx, stdio: 'inherit'});

rmSync(out, {recursive: true, force: true});
mkdirSync(join(out, 'server', 'dist'), {recursive: true});
mkdirSync(join(out, 'server', 'data'), {recursive: true});
mkdirSync(join(out, 'web', 'app'), {recursive: true});

cpSync(
  join(root, 'server', 'data', 'area-icon-ids.json'),
  join(out, 'server', 'data', 'area-icon-ids.json'),
);
cpSync(webDist, join(out, 'web', 'app', 'dist'), {recursive: true});

const bundleScript = join(root, 'scripts', 'bundle-server-docker.mjs');
const bundleOut = join(out, 'server', 'dist', 'docker-bundle.cjs');
execSync(`node "${bundleScript}" "${bundleOut}"`, {cwd: root, stdio: 'inherit'});

const pruneScript = join(ctx, 'docker-prune-native-deps.mjs');
execSync(`node "${pruneScript}" "${join(ctx, 'node_modules')}" "${out}"`, {stdio: 'inherit'});

console.log('OK — desktop runtime:', out);
if (process.platform !== 'win32') {
  try {
    console.log('     (size)', execSync(`du -sh "${out}"`, {encoding: 'utf8'}).trim());
  } catch {
    /* ignore */
  }
}
