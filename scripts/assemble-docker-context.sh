#!/usr/bin/env bash
# Prépare `.dockerctx/` : artefacts de build + métadonnées npm, **sans** node_modules
# (install prod Linux dans le Dockerfile, étape `deps`).
#
# Prérequis : à la racine du repo après `npm ci` et `npm run build`.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -d server/dist || ! -d web/app/dist ]]; then
  echo "error: server/dist ou web/app/dist manquant — lance npm run build d’abord." >&2
  exit 1
fi

rm -rf .dockerctx
mkdir -p .dockerctx/server .dockerctx/web/app

cp Dockerfile .dockerctx/Dockerfile
cp package.json package-lock.json .dockerctx/
cp server/package.json .dockerctx/server/
cp web/app/package.json .dockerctx/web/app/
cp -r shared .dockerctx/shared
cp -r server/dist .dockerctx/server/dist
cp -r web/app/dist .dockerctx/web/app/dist

echo "OK — contexte Docker : $ROOT/.dockerctx ($(du -sh .dockerctx | cut -f1))"
