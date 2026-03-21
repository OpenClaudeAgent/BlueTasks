# BlueTasks

BlueTasks is a local-web-first task app rebuilt to deliver a focused tasks experience with:

- a left sidebar and a single main panel
- expandable task cards
- permanent editing in place
- rich notes with Lexical
- one follow-up date per task
- local SQLite persistence
- FR/EN support from day one

For a concise map of folders, API vs SQLite, export endpoint, Docker layout, and the shared area-icon contract, see [docs/architecture.md](docs/architecture.md). Accessibility linting notes: [docs/a11y.md](docs/a11y.md). **Quality** (tests, coverage, jscpd, CI): [docs/quality.md](docs/quality.md). **MCP RPG** (index sémantique) : [docs/rpg.md](docs/rpg.md).

## Local development

Install dependencies:

```sh
npm install
```

Run the frontend and the local API together:

```sh
npm run dev
```

The frontend runs on [http://localhost:5173](http://localhost:5173) and proxies API requests to [http://localhost:8787](http://localhost:8787).

The web client calls the API **directly** at `http://localhost:8787` during `vite` dev and on **`vite preview`** (port 4173), so you must have the BlueTasks server listening there (or set `VITE_API_ORIGIN` in `web/app/.env` to your API base URL, without trailing slash).

## Production-style local run

Build everything:

```sh
npm run build
```

Then start the local server:

```sh
npm run start
```

The server exposes the built app on [http://localhost:8787](http://localhost:8787).

## Docker

Production image (Express serves the Vite build; port **8787**). Build flow: **npm** builds the app locally/CI, then Docker copies artifacts and runs **`npm ci --omit=dev`** for Linux in a `deps` stage (correct `better-sqlite3` binary).

```sh
npm run docker:release
docker compose build && docker compose up -d
```

Open [http://localhost:8787](http://localhost:8787). SQLite lives in `./.data` on the host (mounted at `/app/.data` in the container).

**Settings → General** : export (`GET /api/export/database`) and import (`POST /api/import/database`, multipart field `database`) of the full `.sqlite` file.

Multi-stage image, GHCR publish on tags `v*`, and `docker run` examples: [docs/docker.md](docs/docker.md).
