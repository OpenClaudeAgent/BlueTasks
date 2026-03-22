# BlueTasks (Tauri desktop)

Native shell around the same stack as Docker: **embedded Node.js** runs `server/dist/docker-bundle.cjs` (Express + SQLite), and the window loads **http://127.0.0.1:8787`.

**Scope (for now):** desktop only (**macOS**, **Windows**, **Linux**). **No** iOS or Android in this repo yet — Tauri mobile is not set up. Linux release bundles use **`.deb`** (`src-tauri/tauri.linux.conf.json`).

## Prerequisites

- Rust + platform [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)
- Node 22 (repo root)

## One-time prep (before `tauri dev` or `tauri build`)

From the **repository root**:

```bash
npm run desktop:prep
```

This builds web + server, assembles `src-tauri/resources/bluetasks-runtime/`, and downloads Node into `src-tauri/resources/node/` for your OS/arch (`EMBEDDED_NODE_VERSION` optional).

## Run

```bash
cd desktop
npm install
npm run tauri dev
```

## Release build

```bash
cd desktop
npm run tauri build
```

`beforeBuildCommand` runs `npm run prep`, which invokes `desktop:prep` from the repo root (embedded runtime + Node).

## Data

SQLite and WAL files live under the OS app data directory (`BLUETASKS_DATA_DIR`), not inside the read-only app bundle. Static assets and the server bundle use `BLUETASKS_HOME` (the copied `bluetasks-runtime` tree).

## App icon

See [docs/desktop.md](../docs/desktop.md).
