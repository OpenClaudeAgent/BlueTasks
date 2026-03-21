# BlueTasks (Tauri desktop)

Native shell around the same stack as Docker: **embedded Node.js** runs `server/dist/docker-bundle.cjs` (Express + SQLite), and the window loads **http://127.0.0.1:8787`.

**Scope (for now):** desktop only (**macOS**, **Windows**, **Linux**). **No** iOS or Android in this repo yet — Tauri mobile is not set up. PR **CI** builds all three; Linux release artifact is **`.deb`** (see `src-tauri/tauri.linux.conf.json`).

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

### macOS `.dmg` from Releases

Artifacts named like `BlueTasks_*_aarch64.dmg` are **Apple Silicon (arm64)** only. Open the DMG, drag **BlueTasks** into **Applications**. Builds from CI are **not code-signed**: if macOS blocks launch, use **Right-click → Open**, or `xattr -dr com.apple.quarantine /Applications/BlueTasks.app`. To read server errors, run `/Applications/BlueTasks.app/Contents/MacOS/BlueTasks` in a terminal.

## Data

SQLite and WAL files live under the OS app data directory (`BLUETASKS_DATA_DIR`), not inside the read-only app bundle. Static assets and the server bundle use `BLUETASKS_HOME` (the copied `bluetasks-runtime` tree).

## App icon

Source vector: [`src-tauri/icons/bluetasks-icon.svg`](src-tauri/icons/bluetasks-icon.svg). Regenerate platform bitmaps (macOS/Windows/Linux bundle assets) from the repo root:

```bash
cd desktop && npx tauri icon ./src-tauri/icons/bluetasks-icon.svg -o ./src-tauri/icons
```

The web app favicon is a copy at [`web/app/public/bluetasks-icon.svg`](../web/app/public/bluetasks-icon.svg).
