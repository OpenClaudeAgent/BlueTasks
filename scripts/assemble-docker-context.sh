#!/usr/bin/env bash
# Prépare `.dockerctx/` : bundle serveur (esbuild), front dist, server/data (icônes), lockfile pour
# l’étape `deps` du Dockerfile (npm ci Linux → prune → image sans node_modules complet).
#
# Prérequis : `npm run build` déjà fait, ou utiliser `npm run package:docker` (build + ce script).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f server/dist/index.js || ! -d web/app/dist ]]; then
  echo "error: server/dist/index.js ou web/app/dist manquant — lance npm run build d’abord." >&2
  exit 1
fi

rm -rf .dockerctx
mkdir -p .dockerctx/server/dist .dockerctx/server/data .dockerctx/web/app .dockerctx/contract

cp Dockerfile .dockerctx/Dockerfile
cp package.json package-lock.json .dockerctx/
cp server/package.json .dockerctx/server/
cp web/app/package.json .dockerctx/web/app/
cp scripts/docker-prune-native-deps.mjs .dockerctx/docker-prune-native-deps.mjs
cp server/data/area-icon-ids.json .dockerctx/server/data/area-icon-ids.json
cp -r web/app/dist .dockerctx/web/app/dist

node "$ROOT/scripts/bundle-server-docker.mjs" "$ROOT/.dockerctx/server/dist/docker-bundle.cjs"

echo "OK — contexte Docker : $ROOT/.dockerctx ($(du -sh .dockerctx | cut -f1))"
