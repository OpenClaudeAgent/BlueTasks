#!/usr/bin/env node
/**
 * Copie sous outRoot/node_modules/ uniquement better-sqlite3 et ses deps runtime
 * (pas prebuild-install ni son arbre — utilisé seulement à l’install npm).
 *
 * Usage: node docker-prune-native-deps.mjs <sourceNodeModulesDir> <outRoot>
 * Ex.: node docker-prune-native-deps.mjs /app/node_modules /opt/pruned
 */
import {cpSync, existsSync, mkdirSync, readFileSync} from 'node:fs';
import {dirname, join, relative} from 'node:path';

const SKIP_DEPS = new Set(['prebuild-install']);

const [nmRoot, outRoot] = process.argv.slice(2);
if (!nmRoot || !outRoot) {
  console.error('usage: node docker-prune-native-deps.mjs <node_modules> <outRoot>');
  process.exit(1);
}

const outNm = join(outRoot, 'node_modules');
mkdirSync(outNm, {recursive: true});

/** Racine hoisted sous nmRoot (ex. better-sqlite3). */
function resolveRootPackage(name) {
  if (name.startsWith('@')) {
    const [scope, pkg] = name.split('/');
    const p = join(nmRoot, scope, pkg);
    if (existsSync(join(p, 'package.json'))) {
      return p;
    }
  } else {
    const p = join(nmRoot, name);
    if (existsSync(join(p, 'package.json'))) {
      return p;
    }
  }
  throw new Error(`Cannot find top-level package "${name}" under ${nmRoot}`);
}

/** @param {string} depName e.g. "bindings" or "@scope/pkg" */
function resolvePackage(depName, fromPkgRoot) {
  const local = join(fromPkgRoot, 'node_modules', depName);
  if (existsSync(join(local, 'package.json'))) {
    return local;
  }
  return resolveRootPackage(depName);
}

function readProdDeps(pkgRoot) {
  const raw = readFileSync(join(pkgRoot, 'package.json'), 'utf8');
  const j = JSON.parse(raw);
  return Object.keys(j.dependencies ?? {}).filter((n) => !SKIP_DEPS.has(n));
}

const copied = new Set();
const queue = [resolveRootPackage('better-sqlite3')];

while (queue.length) {
  const pkgRoot = queue.shift();
  const rel = relative(nmRoot, pkgRoot);
  if (rel.startsWith('..') || rel === '') {
    throw new Error(`bad pkgRoot ${pkgRoot}`);
  }
  if (copied.has(rel)) {
    continue;
  }
  copied.add(rel);
  const dest = join(outNm, rel);
  mkdirSync(dirname(dest), {recursive: true});
  cpSync(pkgRoot, dest, {recursive: true});

  for (const dep of readProdDeps(pkgRoot)) {
    queue.push(resolvePackage(dep, pkgRoot));
  }
}

console.log(`pruned native runtime: ${copied.size} packages -> ${outNm}`);
