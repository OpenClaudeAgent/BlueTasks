# Étape build : dépendances complètes + Vite + tsc
FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY web/app/package.json web/app/package.json

RUN npm ci

COPY shared ./shared
COPY server ./server
COPY web/app ./web/app

RUN npm run build

# Image d’exécution : prod uniquement (pas de devDependencies)
FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY web/app/package.json web/app/package.json

RUN npm ci --omit=dev --workspace=@bluetasks/server

COPY shared ./shared
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/web/app/dist ./web/app/dist

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8787

EXPOSE 8787

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8787/api/tasks').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npm", "run", "start"]
