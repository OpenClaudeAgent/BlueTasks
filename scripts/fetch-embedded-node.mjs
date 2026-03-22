#!/usr/bin/env node
/**
 * Downloads the official Node.js runtime (pinned version) into
 * `desktop/src-tauri/resources/node/` for bundling with the Tauri app.
 *
 * Set EMBEDDED_NODE_VERSION to override (default: 22.14.0, Node 22 line).
 *
 * Unix archives use relative symlinks under `bin/` (e.g. corepack → ../lib/...).
 * Copying from a temp extract dir with `cpSync(..., { dereference: true })` and
 * then deleting that dir can leave broken absolute symlinks on Linux. We extract
 * straight into `resources/` and rename the versioned folder to `node` instead.
 */
import {
  createWriteStream,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  renameSync,
  rmSync,
} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {pipeline} from 'node:stream/promises';
import {fileURLToPath} from 'node:url';
import {execSync} from 'node:child_process';

const VERSION = process.env.EMBEDDED_NODE_VERSION?.trim() || '22.14.0';
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(repoRoot, 'desktop', 'src-tauri', 'resources', 'node');
const resourcesParent = dirname(outDir);

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

/** Move a directory tree; fall back to recursive copy if rename crosses devices (EXDEV). */
function moveExtractedTree(from, to) {
  try {
    renameSync(from, to);
  } catch (e) {
    if (e && typeof e === 'object' && 'code' in e && e.code === 'EXDEV') {
      rmSync(to, {recursive: true, force: true});
      cpSync(from, to, {recursive: true});
    } else {
      throw e;
    }
  }
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

mkdirSync(resourcesParent, {recursive: true});
rmSync(outDir, {recursive: true, force: true});

if (isWin) {
  execSync(
    `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${archivePath.replace(/'/g, "''")}' -DestinationPath '${tmp.replace(/'/g, "''")}'"`,
    {stdio: 'inherit'},
  );
  const extractedDir = join(tmp, archiveBase);
  if (!existsSync(extractedDir)) {
    const entries = readdirSync(tmp).filter((n) => n.startsWith('node-v'));
    throw new Error(
      `Expected extracted folder ${archiveBase} under ${tmp}, found: ${entries.join(', ') || '(none)'}`,
    );
  }
  moveExtractedTree(extractedDir, outDir);
} else {
  const staged = join(resourcesParent, archiveBase);
  rmSync(staged, {recursive: true, force: true});
  execSync(`tar -xzf "${archivePath}" -C "${resourcesParent}"`, {stdio: 'inherit'});
  if (!existsSync(staged)) {
    const entries = readdirSync(resourcesParent).filter((n) => n.startsWith('node-v'));
    throw new Error(
      `Expected extracted folder ${archiveBase} under ${resourcesParent}, found: ${entries.join(', ') || '(none)'}`,
    );
  }
  renameSync(staged, outDir);
}

rmSync(tmp, {recursive: true, force: true});
console.log('[fetch-node] OK ->', outDir);
