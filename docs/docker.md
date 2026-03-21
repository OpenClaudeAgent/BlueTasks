# Docker and image publishing

## Local image

The **JS build** (Vite + `tsc`) runs **on the host** (or on GitHub Actions), not in the final image layer. The Docker context is only ~1 MB of artifacts plus `package-lock.json`; **`npm ci --omit=dev`** for the server runs in an intermediate **Linux** stage so `better-sqlite3` matches the target OS (avoids *Exec format error* when building on macOS).

```bash
npm run docker:release    # npm ci + build + .dockerctx/
docker compose build
docker compose up -d
```

The app listens on **8787**. SQLite data lives in **`./.data`** on the host (`bluetasks.sqlite`).

Useful env vars: `HOST` (default `0.0.0.0`), `PORT` (default `8787`).

## What is in the image

- **CI / GitHub Actions**: `npm ci` → `npm run build` → `scripts/assemble-docker-context.sh` → `docker build` on `.dockerctx/`. No second Vite build inside Docker.
- **Dockerfile**: **`deps`** stage (Alpine + native toolchain only to compile/download `better-sqlite3`), **`runtime`** stage without gcc/python — copies `node_modules` + `server/dist` + `web/app/dist` + `shared/`. Entrypoint: `node server/dist/index.js`.
- **Platforms**: **Docker image** workflow runs **amd64** (`ubuntu-latest`) and **arm64** (`ubuntu-24.04-arm`) in parallel, then publishes a multi-arch manifest `:tag` and `:latest`. Per-arch tags `:tag-amd64` / `:tag-arm64`. Buildx **GHA** cache on the context.

## PR smoke build

Workflow [`.github/workflows/docker-smoke.yml`](../.github/workflows/docker-smoke.yml) runs on pull requests that change Docker-related paths: it runs `npm run build`, assembles `.dockerctx/`, and **`docker buildx build --load`** for `linux/amd64` only (nothing is pushed). Use it to catch broken Dockerfiles before tagging.

## SQLite import / export

- **Export**: Settings → General, or `GET /api/export/database`.
- **Import**: Settings → General (`.sqlite` file), or `POST /api/import/database` (multipart, field **`database`**). Replaces the on-disk database entirely; **not available** when the server uses an in-memory DB (tests).

## GitHub Container Registry (GHCR)

For a single entry point that bumps **semver in all workspaces**, updates **CHANGELOG**, and pushes the **git tag** that triggers this pipeline, use the [**Release** workflow](../.github/workflows/release.yml) (documented in [releasing.md](releasing.md)).

### Package visibility

- If the GitHub **repository** is public, you can still set the **container package** to private under **Packages → package settings → Change visibility**. For open distribution, set the package to **Public** so `docker pull` works without `docker login ghcr.io`.
- Private packages: users must run `docker login ghcr.io` (PAT with `read:packages`, or `GITHUB_TOKEN` in CI).

### Publishing

**Option A — version tag (recommended for releases)**

1. Tag and push: `git tag v0.2.0 && git push origin v0.2.0`.
2. Workflow [`.github/workflows/docker-publish.yml`](../.github/workflows/docker-publish.yml) builds and pushes:

   `ghcr.io/<owner>/bluetasks:<tag>`

   (`<owner>/<repo>` is lowercased for the image name.)

3. Pull and run:

   ```bash
   docker pull ghcr.io/your-org/bluetasks:v0.2.0
   docker run -p 8787:8787 -v bluetasks-data:/app/.data ghcr.io/your-org/bluetasks:v0.2.0
   ```

**Option B — manual workflow dispatch**

In **Actions → Docker image → Run workflow**, enter a tag (e.g. `v0.2.0-rc1`). The workflow pushes the same multi-arch tags and updates `:latest` to that build (use with care on shared repos).

Release notes: see [CHANGELOG.md](../CHANGELOG.md).

### Verify a tagged release on GitHub

1. Open **Actions** → workflow **Docker image** and select the run for your tag.
2. Confirm jobs **Image (amd64)** and **Image (arm64)** succeed, then **Publish multi-arch manifest**.
3. On the package page (`https://github.com/<owner>?tab=packages` or the repo **Packages** sidebar), confirm the new digest and tags (`:vX.Y.Z`, `:latest`).

## `docker-compose` with a published image

Replace `build` with `image`:

```yaml
services:
  bluetasks:
    image: ghcr.io/your-org/bluetasks:v0.2.0
    ports:
      - "8787:8787"
    volumes:
      - ./.data:/app/.data
```

Keep the **`.data`** mount so data survives image upgrades.
