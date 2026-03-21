# Image d’exécution minimale (pas de gcc/python dans la couche finale).
#
# Contexte = sortie de scripts/assemble-docker-context.sh :
#   package.json, lock, server/dist, web/app/dist, shared (sans node_modules).
#
# L’installation npm prod a lieu dans l’étape « deps » sous Linux, pour que
# better-sqlite3 soit compilé/téléchargé pour la bonne plateforme (CI, Mac, etc.).

FROM node:22-alpine AS deps
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY web/app/package.json web/app/
RUN npm ci --omit=dev -w @bluetasks/server

FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8787

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY web/app/package.json web/app/
COPY server/dist ./server/dist
COPY web/app/dist ./web/app/dist
COPY shared ./shared

EXPOSE 8787

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8787/api/tasks').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server/dist/index.js"]
