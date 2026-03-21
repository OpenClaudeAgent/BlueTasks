# Changelog

All notable changes to this project are documented here. Docker images are published to `ghcr.io/<owner>/bluetasks` when a `v*` tag is pushed (see [docs/docker.md](docs/docker.md)).

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

- Tooling: ESLint Vitest + Testing Library (web/server), Playwright rules for `scenario/`, Stylelint on `web/app`, jscpd duplicate gate + Semgrep (Docker) in CI; CI splits lint into **separate jobs** (ESLint web/server/scenario/tooling, Stylelint, jscpd, Semgrep) for clearer Actions output; granular scripts `lint:eslint-web`, `lint:stylelint`, `lint:eslint-server`, `lint:eslint-scenario`, `lint:eslint-tooling`; **Semgrep** scans full [`web/app/`](web/app/) and [`server/`](server/) (not only `src/`), plus `contract/`, `scenario/`, `scripts/`, root Playwright + ESLint configs; `npm run semgrep:docker` for Semgrep locally; stronger assertions in scenario + integration tests; [`docs/quality.md`](docs/quality.md) updated.
- Docker: slimmer image — server bundled with esbuild (`docker-bundle.cjs`); runtime `node_modules` reduced to `better-sqlite3` + runtime deps only (prune script in build). CI unchanged flow: `package:docker` then `docker build`.
- Dev: `npm run package:docker` — production build + `.dockerctx/` in one step; `docker:release` now runs `npm ci` then `package:docker`. CI Docker workflows use the same script.
- Docs: English-only pass; expanded [`docs/user-journeys.md`](docs/user-journeys.md) and [`docs/data-model.md`](docs/data-model.md); removed internal roadmap, MVP scope, and MCP RPG notes from `docs/`.
- Scenario tests: Playwright specs under [`scenario/`](scenario/) (formerly `e2e/`); `npm run test:scenario` (replaces `test:e2e`). Split files: [`api.production.spec.ts`](scenario/api.production.spec.ts), [`task-lifecycle.spec.ts`](scenario/task-lifecycle.spec.ts), [`navigation-settings.spec.ts`](scenario/navigation-settings.spec.ts); helpers [`helpers.ts`](scenario/helpers.ts), [`api-helpers.ts`](scenario/api-helpers.ts); English UI via `localStorage` + `locale: en-US`.
- Scenario scaffolds (skipped): priority/pin, estimate/recurrence, timer, notes persistence, Upcoming, area filters, assign area, Settings areas CRUD, language/import, quick capture — plus Vitest todos in [`server/src/api.task-fields.integration.test.ts`](server/src/api.task-fields.integration.test.ts).
- Scenario: [`scenario/editor-toolbar.spec.ts`](scenario/editor-toolbar.spec.ts) — Lexical toolbar (bold, italic, heading, bullet + checklist, table, markdown `[] `, quote, code block, divider).
- Release: [`.github/workflows/release.yml`](.github/workflows/release.yml) — enter semver (e.g. `0.2.0`) to sync all workspace `package.json` versions, update this file, refresh `package-lock.json`, commit, push tag `v*`, and trigger Docker publish (see [docs/releasing.md](docs/releasing.md)).
- CI: optional manual runs (`workflow_dispatch`) for [CI](.github/workflows/ci.yml) and [Docker image](.github/workflows/docker-publish.yml).
- CI: removed standalone **Docker build check** workflow; the image is built and pushed only via [Docker image](.github/workflows/docker-publish.yml) (tag or dispatch).

## [0.1.6] - 2026-03-21

- Slimmer GHCR image (esbuild bundle + pruned native deps). Remove Docker build-check workflow.

## [0.1.5] - 2026-03-21

- TaskCard modules; E2E app-shell and quick-capture API checks; DELETE unknown task idempotence

## [0.1.4] - 2026-03-21

- Patch release; pull `ghcr.io/<owner>/bluetasks:v0.1.4` (multi-arch manifest).
- CI actions upgraded (checkout/setup-node/upload-artifact, Docker build/push); README run docs; scenario Playwright suite; server Vitest `maxConcurrency` for stable API tests.

## [0.1.3] - 2026-03-20

- Patch release; pull `ghcr.io/<owner>/bluetasks:v0.1.3` (multi-arch manifest).

## [0.1.2] - 2026-03-20

- Patch release; pull `ghcr.io/<owner>/bluetasks:v0.1.2`.

## [0.1.1] - 2026-03-20

- Patch release; pull `ghcr.io/<owner>/bluetasks:v0.1.1`.

## [0.1.0] - 2026-03-20

- Initial published image tag `v0.1.0` (multi-arch GHCR workflow).

[Unreleased]: https://github.com/OpenClaudeAgent/BlueTasks/compare/v0.1.6...HEAD
[0.1.6]: https://github.com/OpenClaudeAgent/BlueTasks/compare/v0.1.5...v0.1.6
[0.1.5]: https://github.com/OpenClaudeAgent/BlueTasks/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/OpenClaudeAgent/BlueTasks/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/OpenClaudeAgent/BlueTasks/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/OpenClaudeAgent/BlueTasks/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/OpenClaudeAgent/BlueTasks/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/OpenClaudeAgent/BlueTasks/releases/tag/v0.1.0
