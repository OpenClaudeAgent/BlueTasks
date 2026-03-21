# Changelog

All notable changes to this project are documented here. Docker images are published to `ghcr.io/<owner>/bluetasks` when a `v*` tag is pushed (see [docs/docker.md](docs/docker.md)).

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

- E2E: [`e2e/bluetasks.spec.ts`](e2e/bluetasks.spec.ts) — real browser flows (create + reload, mark done, expand/collapse, sidebar, Settings); English UI via `localStorage` + `locale: en-US`; empty DB between lifecycle tests via API deletes.
- Release: [`.github/workflows/release.yml`](.github/workflows/release.yml) — enter semver (e.g. `0.2.0`) to sync all workspace `package.json` versions, update this file, refresh `package-lock.json`, commit, push tag `v*`, and trigger Docker publish (see [docs/releasing.md](docs/releasing.md)).
- CI: optional manual runs (`workflow_dispatch`) for [CI](.github/workflows/ci.yml) and [Docker image](.github/workflows/docker-publish.yml).
- CI: [Docker build check](.github/workflows/docker-build-check.yml) verifies the image builds on relevant PRs (amd64, no push).

## [0.1.3] - 2026-03-20

- Patch release; pull `ghcr.io/<owner>/bluetasks:v0.1.3` (multi-arch manifest).

## [0.1.2] - 2026-03-20

- Patch release; pull `ghcr.io/<owner>/bluetasks:v0.1.2`.

## [0.1.1] - 2026-03-20

- Patch release; pull `ghcr.io/<owner>/bluetasks:v0.1.1`.

## [0.1.0] - 2026-03-20

- Initial published image tag `v0.1.0` (multi-arch GHCR workflow).

[Unreleased]: https://github.com/OpenClaudeAgent/BlueTasks/compare/v0.1.3...HEAD
[0.1.3]: https://github.com/OpenClaudeAgent/BlueTasks/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/OpenClaudeAgent/BlueTasks/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/OpenClaudeAgent/BlueTasks/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/OpenClaudeAgent/BlueTasks/releases/tag/v0.1.0
