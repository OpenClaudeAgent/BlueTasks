# Releases and version alignment

BlueTasks uses **one semver** for the whole monorepo: root [`package.json`](../package.json), [`web/app/package.json`](../web/app/package.json), and [`server/package.json`](../server/package.json) must stay **identical**. [`package-lock.json`](../package-lock.json) is refreshed with `npm install` after any version bump.

## Automated release (recommended)

1. Merge your work to the default branch (`main`).
2. Open **Actions** → **Release** → **Run workflow**.
3. Fill **version** with semver **only** (e.g. `0.2.0`, no leading `v`).
4. Optionally add a one-line **release_notes** bullet (shown in [`CHANGELOG.md`](../CHANGELOG.md)).
5. Run the workflow.

The job will:

- Refuse invalid semver or an **existing** `v*` tag.
- Set the same `version` in all three `package.json` files.
- Insert the new section into `CHANGELOG.md` and update compare links.
- Run `npm install` to sync `package-lock.json`.
- Commit `chore(release): vX.Y.Z`, create tag `vX.Y.Z`, and **push** commit + tag.

Pushing tag **`v*`** starts the [**Docker image**](../.github/workflows/docker-publish.yml) workflow (multi-arch image on GHCR, `:latest` updated).

## Manual release (local)

```bash
node scripts/sync-package-version.mjs 0.2.0
# optional: edit CHANGELOG.md by hand
npm install --no-audit --no-fund
git add package.json package-lock.json web/app/package.json server/package.json CHANGELOG.md
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
