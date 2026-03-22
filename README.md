# BlueTasks

**Local-first** tasks: one board, expandable cards, rich notes, a due date per task, **SQLite** on disk, **FR / EN** UI.

License [MIT](LICENSE) · [Changelog](CHANGELOG.md)

## Install and run

### Docker (prebuilt image)

Log in to GHCR if the image is private: `docker login ghcr.io`

Pick a tag from [Releases](https://github.com/OpenClaudeAgent/BlueTasks/tags) (or use `:latest`). Example:

```bash
docker pull ghcr.io/openclaudeagent/bluetasks:latest
mkdir -p ./bluetasks-data
docker run --rm -d \
  --name bluetasks \
  -p 8787:8787 \
  -v "$(pwd)/bluetasks-data:/app/.data" \
  ghcr.io/openclaudeagent/bluetasks:latest
```

Stop: `docker stop bluetasks`

### Node (no Docker)

Requires [Node.js 22](https://nodejs.org/).

```bash
git clone https://github.com/OpenClaudeAgent/BlueTasks.git
cd BlueTasks
npm install
npm run build
npm run start
```

### Docker Compose (from source)

```bash
git clone https://github.com/OpenClaudeAgent/BlueTasks.git
cd BlueTasks
npm run docker:release
docker compose up --build -d
```

More detail: [docs/docker.md](docs/docker.md)

### Desktop app (Tauri)

Native shell with embedded Node — same server stack as Docker. See [desktop/README.md](desktop/README.md) (prep, `tauri dev` / `tauri build`).

## Using the app

Open **http://localhost:8787** (or the URL shown by your setup). Data lives under **`.data/`** at the project root (e.g. `bluetasks.sqlite`), or in the folder you mounted for Docker.

## Backup

- **In the app:** Settings → General → export / import a `.sqlite` file.
- **Files:** copy the **`.data`** directory (or your Docker volume folder).

## Repository layout

High level: `web/app` (React UI), `server` (API + SQLite), `contract` (shared types/schemas), `desktop` (Tauri), `e2e` (Playwright), `scripts` (build / Docker / desktop). See [docs/architecture.md](docs/architecture.md).

## Documentation and development

More topics (product, data model, i18n, tests, releases): **[docs/](docs/)**.

Run the full stack locally:

```bash
npm install
npm run dev
```

- UI: http://localhost:5173 · API: http://localhost:8787 (root `npm run dev` starts both.)

Same checks as CI: `npm run ci` — details in [docs/quality.md](docs/quality.md).

Optional: `web/app/.env` with `VITE_API_ORIGIN=https://your-api` (no trailing slash) if the API is not on `localhost:8787`.

**Releases:** one semver across packages; ship via GitHub **Actions → Release** workflow (see [docs/releasing.md](docs/releasing.md)). Forks: replace `OpenClaudeAgent/BlueTasks` and `openclaudeagent` in URLs / image names with your org.

---

[![CI](https://github.com/OpenClaudeAgent/BlueTasks/actions/workflows/ci.yml/badge.svg)](https://github.com/OpenClaudeAgent/BlueTasks/actions/workflows/ci.yml)
[![Docker image](https://github.com/OpenClaudeAgent/BlueTasks/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/OpenClaudeAgent/BlueTasks/actions/workflows/docker-publish.yml)
