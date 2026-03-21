#!/usr/bin/env node
/**
 * Downloads the official Node.js runtime (pinned version) into
 * `desktop/src-tauri/resources/node/` for bundling with the Tauri app.
 *
 * Set EMBEDDED_NODE_VERSION to override (default: 22.14.0, Node 22 line).
 */
import {createWriteStream, cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {pipeline} from 'node:stream/promises';
import {fileURLToPath} from 'node:url';
import {execSync} from 'node:child_process';

const VERSION = process.env.EMBEDDED_NODE_VERSION?.trim() || '22.14.0';
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(repoRoot, 'desktop', 'src-tauri', 'resources', 'node');

function platformKey() {
  const p = process.platform;
  const a = process.arch;
  if (p === 'darwin' && a === 'arm64') return 'darwin-arm64';
  if (p === 'darwin' && a === 'x64') return 'darwin-x64';
  if (p === 'linux' && a === 'x64') return 'linux-x64';
  if (p === 'linux' && a === 'arm64') return 'linux-arm64';
  if (p === 'win32' && (a === 'x64' || a === 'arm64')) return 'win-x64';
  throw new Error(`Unsupported platform: ${p} ${a}`);
}

async function downloadFile(url, dest) {
  const res = await fetch(url);
  if (!res.ok || !res.body) {
    throw new Error(`GET ${url} failed: ${res.status} ${res.statusText}`);
  }
  await pipeline(res.body, createWriteStream(dest));
}

const key = platformKey();
const isWin = key.startsWith('win');
const archiveBase = `node-v${VERSION}-${key}`;
const archiveName = isWin ? `${archiveBase}.zip` : `${archiveBase}.tar.gz`;
const distUrl = `https://nodejs.org/dist/v${VERSION}/${archiveName}`;

const tmp = mkdtempSync(join(tmpdir(), 'bluetasks-node-'));
const archivePath = join(tmp, archiveName);

console.log('[fetch-node] downloading', distUrl);
await downloadFile(distUrl, archivePath);

if (isWin) {
  execSync(
    `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${archivePath.replace(/'/g, "''")}' -DestinationPath '${tmp.replace(/'/g, "''")}'"`,
    {stdio: 'inherit'},
  );
} else {
  execSync(`tar -xzf "${archivePath}" -C "${tmp}"`, {stdio: 'inherit'});
}

const extractedDir = join(tmp, archiveBase);
if (!existsSync(extractedDir)) {
  const entries = readdirSync(tmp).filter((n) => n.startsWith('node-v'));
  throw new Error(
    `Expected extracted folder ${archiveBase} under ${tmp}, found: ${entries.join(', ') || '(none)'}`,
  );
}

rmSync(outDir, {recursive: true, force: true});
mkdirSync(outDir, {recursive: true});
// Dereference symlinks (npm/corepack/npx in official tar point into the tree; default cp would keep dead links to tmp).
cpSync(extractedDir, outDir, {recursive: true, dereference: true});

rmSync(tmp, {recursive: true, force: true});
console.log('[fetch-node] OK ->', outDir);
