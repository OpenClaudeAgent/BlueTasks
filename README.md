# BlueTasks

[![CI](https://github.com/OpenClaudeAgent/BlueTasks/actions/workflows/ci.yml/badge.svg)](https://github.com/OpenClaudeAgent/BlueTasks/actions/workflows/ci.yml)
[![Docker build check](https://github.com/OpenClaudeAgent/BlueTasks/actions/workflows/docker-build-check.yml/badge.svg)](https://github.com/OpenClaudeAgent/BlueTasks/actions/workflows/docker-build-check.yml)

**Local-first** task app: single main panel, expandable cards, rich notes (Lexical), one follow-up date per task, on-disk **SQLite**, **FR / EN** UI.

License: [MIT](LICENSE). Changelog: [CHANGELOG.md](CHANGELOG.md).

---

## Run the published image (no clone)

Replace `v0.1.3` with the [tag](https://github.com/OpenClaudeAgent/BlueTasks/tags) you want.

1. **Pull** the image:

   ```bash
   docker pull ghcr.io/openclaudeagent/bluetasks:v0.1.3
   ```

   If the package is **private**: `docker login ghcr.io` first.

2. **Data directory** on the host:

   ```bash
   mkdir -p ./bluetasks-data
   ```

3. **Run** (publish port **8787** and mount data):

   ```bash
   docker run --rm -d \
     --name bluetasks \
     -p 8787:8787 \
     -v "$(pwd)/bluetasks-data:/app/.data" \
     ghcr.io/openclaudeagent/bluetasks:v0.1.3
   ```

4. Open **http://localhost:8787**.

5. **Stop**: `docker stop bluetasks`.

`docker pull` alone does not start a server — you need `docker run` with **`-p 8787:8787`**.

---

## From a repo clone (Docker Compose)

Requires [Node.js 22](https://nodejs.org/) and Docker.

```bash
git clone https://github.com/OpenClaudeAgent/BlueTasks.git
cd BlueTasks
npm run docker:release
docker compose up --build -d
```

Then **http://localhost:8787**. Data is in **`./.data`** at the repo root (mounted into the container).

---

## Without Docker (Node only)

```bash
git clone https://github.com/OpenClaudeAgent/BlueTasks.git
cd BlueTasks
npm install
npm run build
npm run start
```

Then **http://localhost:8787**. SQLite is created at **`.data/bluetasks.sqlite`** in the repo root.

---

## Data backup

- **In-app**: Settings → General → export / import a **`.sqlite`** database file.
- **Files**: copy the **`.data`** directory (or `bluetasks-data` if you used the `docker run` example above).

---

## Development

```bash
npm install
npm run dev
```

- Frontend: **http://localhost:5173** (Vite).
- API: **http://localhost:8787** — the client calls this port in dev; run both (e.g. `npm run dev` at the repo root).

Optional: `web/app/.env` with `VITE_API_ORIGIN=https://your-api` (no trailing slash) if the API is not on `localhost:8787`.

### Quality gate (same as CI)

Runs lint, duplication scan, **Vitest coverage gate (≥80% on web `src/lib/**` and server `src/`)**, production build, and Playwright end-to-end tests.

```bash
npm run ci
```

---

## Documentation

| Topic | Doc |
|--------|-----|
| Quality, tests, coverage, workflows | [docs/quality.md](docs/quality.md) |
| BDD layers (unit / integration / E2E) | [docs/testing-strategy.md](docs/testing-strategy.md) |
| Architecture, API, SQLite | [docs/architecture.md](docs/architecture.md) |
| Accessibility (lint) | [docs/a11y.md](docs/a11y.md) |
| Docker, GHCR, tags `v*`, manual dispatch | [docs/docker.md](docs/docker.md) |
| Versioning, Release workflow, CHANGELOG | [docs/releasing.md](docs/releasing.md) |
| MCP RPG index | [docs/rpg.md](docs/rpg.md) |

---

## Releases and images

- **One version everywhere**: root, `web/app`, and `server` `package.json` share the same semver (see [docs/releasing.md](docs/releasing.md)).
- **Ship a release**: GitHub **Actions → Release → Run workflow** → enter `0.2.0` (no `v`). That bumps packages + lockfile + `CHANGELOG.md`, commits, pushes tag **`v0.2.0`**, which triggers **Docker image** on GHCR (`:v0.2.0` and `:latest`).
- **Manual tag only**: `git tag v0.2.0 && git push origin v0.2.0` still builds Docker, but keep `package.json` / lockfile in sync or versions will lie.
- For forks, replace `OpenClaudeAgent/BlueTasks` and `openclaudeagent` in URLs / image names with your org (GHCR image names are lowercase).
