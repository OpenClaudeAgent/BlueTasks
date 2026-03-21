# Runtime léger : bundle JS (express, cors, multer, etc.) + uniquement la chaîne native
# better-sqlite3 (compilée / prébuild pour la plateforme dans l’étape deps).
#
# Contexte = `npm run package:docker` : docker-bundle.mjs, web/app/dist, shared,
# fichiers npm + script de prune (pas de node_modules dans le contexte hôte).

FROM node:25-alpine AS deps
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY web/app/package.json web/app/
RUN npm ci --omit=dev -w @bluetasks/server
COPY docker-prune-native-deps.mjs ./
RUN node docker-prune-native-deps.mjs /app/node_modules /opt/pruned

FROM node:25-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8787

COPY --from=deps /opt/pruned/node_modules ./node_modules
COPY server/dist/docker-bundle.cjs ./server/dist/docker-bundle.cjs
COPY web/app/dist ./web/app/dist
COPY shared ./shared

EXPOSE 8787

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8787/api/tasks').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server/dist/docker-bundle.cjs"]
