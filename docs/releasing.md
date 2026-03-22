# Releases and version alignment

BlueTasks uses **one semver** for the whole monorepo: root [`package.json`](../package.json), [`web/app/package.json`](../web/app/package.json), [`server/package.json`](../server/package.json), [`desktop/package.json`](../desktop/package.json), [`desktop/src-tauri/tauri.conf.json`](../desktop/src-tauri/tauri.conf.json), and [`desktop/src-tauri/Cargo.toml`](../desktop/src-tauri/Cargo.toml) must stay **aligned** (see [`sync-package-version.mjs`](../scripts/sync-package-version.mjs)). [`package-lock.json`](../package-lock.json) is refreshed with `npm install` after any version bump.

## How releases actually ship

**Routine releases are done only through GitHub Actions**, not by bumping versions locally (and not by agents or scripts in a dev environment “doing a release” for you).

1. Merge feature work to the default branch (`main`).
2. In the repo: **Actions** → workflow **[Release](../.github/workflows/release.yml)** → **Run workflow**.
3. Set **version** to semver **only** (e.g. `0.2.0`, no leading `v`).
4. Optionally set **release_notes** (one line; appended under that version in [`CHANGELOG.md`](../CHANGELOG.md)).
5. Run the workflow.

What it does:

- Refuses invalid semver or an **existing** `v*` tag.
- Sets the same `version` in workspace `package.json` files plus desktop Tauri manifests ([`sync-package-version.mjs`](../scripts/sync-package-version.mjs)).
- Inserts the new section into `CHANGELOG.md` and updates compare links ([`changelog-release.mjs`](../scripts/changelog-release.mjs)).
- Runs `npm install` to sync `package-lock.json`.
- Commits `chore(release): vX.Y.Z`, creates tag `vX.Y.Z`, and **pushes** commit + tag.
- Runs follow-up jobs that **dispatch** [**Docker image**](../.github/workflows/docker-publish.yml) and [**Desktop release**](../.github/workflows/desktop-publish.yml) with `tag=vX.Y.Z` (GHCR gets `:vX.Y.Z` and `:latest`; desktop builds upload to the GitHub Release). The bot’s tag push does **not** trigger other workflows, so both pipelines are started explicitly via `gh workflow run`.
- [**Desktop release**](../.github/workflows/desktop-publish.yml) builds in parallel on **`macos-latest`** and **`windows-latest`**, then attaches artifacts to the release (unsigned). **No** mobile (iOS/Android) for now.
  - **macOS:** `BlueTasks_X.Y.Z_macos_aarch64.app.zip` and DMG if produced.
  - **Windows:** NSIS `.exe` (and `.msi` if the bundle produced one).
  - **Linux:** `.deb` (x64) from `bundle/deb/` (see [`tauri.linux.conf.json`](../desktop/src-tauri/tauri.linux.conf.json)).
- If you push a tag **`v*`** yourself (escape hatch), `push: tags` still runs **Docker** and **Desktop** workflows without a manual dispatch.

That pipeline is the **source of truth** for a release—not a local bump by hand or by tooling unless you are in the escape hatch below.

## README version badge vs GitHub “Latest release”

The README uses Shields **`github/v/tag`** (semver sort), labeled **version**, not **`github/v/release`**.

- **`github/v/release`** reflects the latest **published** GitHub Release. That object is created when [**Desktop release**](../.github/workflows/desktop-publish.yml) finishes (`softprops/action-gh-release`). If only a **git tag** exists (e.g. escape-hatch push) and Desktop did not complete, the badge for “release” can stay on an **older** version while tags and `package.json` already moved forward.
- **`github/v/tag`** matches the **newest `v*` tag** and stays consistent with the monorepo semver. The badge still links to the [Releases](https://github.com/OpenClaudeAgent/BlueTasks/releases) list for downloads.

After a normal **Actions → Release** run, Docker and Desktop are dispatched explicitly; when Desktop succeeds, you get both an up-to-date tag **and** a proper GitHub Release.

## Manual release (local, escape hatch only)

Use this **only** if the **Release** workflow cannot run (e.g. bot blocked by branch rules, Actions outage). For normal shipping, use **Actions → Release** above.

```bash
node scripts/sync-package-version.mjs 0.2.0
# optional: edit CHANGELOG.md by hand
npm install --no-audit --no-fund
git add package.json package-lock.json web/app/package.json server/package.json desktop/package.json desktop/src-tauri/tauri.conf.json desktop/src-tauri/Cargo.toml CHANGELOG.md
git commit -m "chore(release): v0.2.0"
git tag v0.2.0
git push origin main && git push origin v0.2.0
```

Use [`scripts/changelog-release.mjs`](../scripts/changelog-release.mjs) if you want the same changelog automation as CI:

```bash
export GITHUB_REPOSITORY=your-org/BlueTasks   # optional
node scripts/changelog-release.mjs 0.2.0 v0.1.3 "Your bullet text"
```

## Branch protection

If `main` rejects pushes from `github-actions[bot]`, either allow the bot to bypass restrictions or run the manual steps locally with a PAT.

## Docker without a new git tag

You can still run [**Docker image**](../.github/workflows/docker-publish.yml) manually with a **tag** input (e.g. `v0.2.0-rc1`) without bumping `package.json` — useful for one-off or preview builds. Prefer the **Release** workflow for real versions so **code, lockfile, changelog, and tag** stay aligned.
