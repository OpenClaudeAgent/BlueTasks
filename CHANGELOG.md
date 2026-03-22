# Changelog

All notable changes to this project are documented here. Docker images are published to `ghcr.io/<owner>/bluetasks` when a `v*` tag is pushed (see [docs/docker.md](docs/docker.md)).

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

- UI: **resizable left sidebar** (drag the right edge); width persisted in `localStorage` (`bluetasks.sidebarWidthPx`), clamped 200–480px.
- UI: pinned header chip shows icon only (accessible name via `aria-label`); task date popover imports **react-day-picker** default CSS, syncs visible **month** when opening, and keeps **selected** day styling; sidebar section icons (All / Today / Upcoming / Anytime) use clearer Lucide metaphors.
- i18n: **de, es, it, nl, pl, pt, ja** plus `en`/`fr`; registry in [`web/app/src/locales/uiLanguages.ts`](web/app/src/locales/uiLanguages.ts); language switcher uses native labels; **date-fns** locales for calendar + DayPicker in [`dayPickerLocale.ts`](web/app/src/lib/dayPickerLocale.ts); E2E language tests updated.
- Area icons: canonical list moved to [`server/data/area-icon-ids.json`](server/data/area-icon-ids.json) (validated by `areaIconIds.ts`); web app imports it via `@bluetasks/server-data`; Docker / desktop runtime copy `server/data/` alongside the bundle.
- Repo: Playwright specs live under [`e2e/`](e2e/) (renamed from `scenario/`); root ESLint [`eslint.e2e.config.mjs`](eslint.e2e.config.mjs); `npm run lint:eslint-e2e`; CI jobs **ESLint (Playwright e2e)** and **E2E tests**; README and docs updated.
- Server: split Express wiring — [`createApp.ts`](server/src/createApp.ts) mounts [`routes/tasksRoutes.ts`](server/src/routes/tasksRoutes.ts), [`routes/areasRoutes.ts`](server/src/routes/areasRoutes.ts), [`routes/importExportRoutes.ts`](server/src/routes/importExportRoutes.ts); shared types [`appTypes.ts`](server/src/appTypes.ts), upload middleware [`importUpload.ts`](server/src/importUpload.ts).
- Scenario: table-driven Lexical toolbar ([`editor-toolbar-helpers.ts`](e2e/editor-toolbar-helpers.ts)); [`api.production.spec.ts`](e2e/api.production.spec.ts) uses [`api-production-helpers.ts`](e2e/api-production-helpers.ts) + parametrized GET/404 cases; new [`settings-export.spec.ts`](e2e/settings-export.spec.ts) (export filename + SQLite header).
- Tooling: jscpd **HTML** report under `jscpd-report/html/` ([`.jscpd.json`](.jscpd.json)); `jscpd-report/` gitignored; [docs/quality.md](docs/quality.md) updated.
- Docs: [testing-strategy.md](docs/testing-strategy.md) — **Behaviour first** principle (tests tied to observable behaviour, not coverage chasing); coverage policy updated for current web gate scope; [quality.md](docs/quality.md) links to it.
- CI: Playwright **E2E** job runs as **2 shards** (`--shard=1/2`, `--shard=2/2`) — parallel machines, each with its own server + SQLite (safe); default **`workers: 1`** kept because a single process shares one DB. [`playwright.config.ts`](playwright.config.ts) documents `PLAYWRIGHT_WORKERS` override; [`app-shell.spec.ts`](e2e/app-shell.spec.ts) waits for **Add task** with a 30s timeout before stricter shell assertions (reduces cold-start flakes).
- Tests: BDD-style `describe` blocks for `mergeTaskFromApi`, `applySavedTaskPreservingLexicalShape`, draft payload `areaId`, `sortTasks` (completed vs pending); `formatTaskDate` / `formatTaskDatePill`; `summarizeText`; estimate label edge cases; RTL [`LanguageSwitcher.test.tsx`](web/app/src/components/LanguageSwitcher.test.tsx); Playwright quick capture validates rows with [`expectApiTaskRow`](e2e/contract-expectations.ts).
- Tooling: ESLint Vitest + Testing Library (web/server), Playwright rules for `e2e/`, Stylelint on `web/app`, jscpd duplicate gate + Semgrep (Docker) in CI; CI splits lint into **separate jobs** (ESLint web/server/e2e/tooling, Stylelint, jscpd, Semgrep) for clearer Actions output; granular scripts `lint:eslint-web`, `lint:stylelint`, `lint:eslint-server`, `lint:eslint-e2e`, `lint:eslint-tooling`; **Semgrep** scans full [`web/app/`](web/app/) and [`server/`](server/) (not only `src/`), plus `contract/`, `e2e/`, `scripts/`, root Playwright + ESLint configs; `npm run semgrep:docker` for Semgrep locally; stronger assertions in E2E + integration tests; [`docs/quality.md`](docs/quality.md) updated.
- Docker: slimmer image — server bundled with esbuild (`docker-bundle.cjs`); runtime `node_modules` reduced to `better-sqlite3` + runtime deps only (prune script in build). CI unchanged flow: `package:docker` then `docker build`.
- Dev: `npm run package:docker` — production build + `.dockerctx/` in one step; `docker:release` now runs `npm ci` then `package:docker`. CI Docker workflows use the same script.
- Docs: English-only pass; expanded [`docs/user-journeys.md`](docs/user-journeys.md) and [`docs/data-model.md`](docs/data-model.md); removed internal roadmap, MVP scope, and MCP RPG notes from `docs/`.
- Scenario tests: Playwright specs under [`e2e/`](e2e/) (folder was previously named `scenario/`); `npm run test:scenario` (replaces `test:e2e`). Split files: [`api.production.spec.ts`](e2e/api.production.spec.ts), [`task-lifecycle.spec.ts`](e2e/task-lifecycle.spec.ts), [`navigation-settings.spec.ts`](e2e/navigation-settings.spec.ts); helpers [`helpers.ts`](e2e/helpers.ts), [`api-helpers.ts`](e2e/api-helpers.ts); English UI via `localStorage` + `locale: en-US`.
- Scenario scaffolds (skipped): priority/pin, estimate/recurrence, timer, notes persistence, Upcoming, area filters, assign area, Settings areas CRUD, language/import, quick capture — plus Vitest todos in [`server/src/api.task-fields.integration.test.ts`](server/src/api.task-fields.integration.test.ts).
- Scenario: [`e2e/editor-toolbar.spec.ts`](e2e/editor-toolbar.spec.ts) — Lexical toolbar (bold, italic, heading, bullet + checklist, table, markdown `[] `, quote, code block, divider).
- Release: [`.github/workflows/release.yml`](.github/workflows/release.yml) — enter semver (e.g. `0.2.0`) to sync all workspace `package.json` versions, update this file, refresh `package-lock.json`, commit, push tag `v*`, and trigger Docker publish (see [docs/releasing.md](docs/releasing.md)).
- CI: optional manual runs (`workflow_dispatch`) for [CI](.github/workflows/ci.yml) and [Docker image](.github/workflows/docker-publish.yml).
- CI: removed standalone **Docker build check** workflow; the image is built and pushed only via [Docker image](.github/workflows/docker-publish.yml) (tag or dispatch).

## [0.2.4] - 2026-03-22

- Tooling: CI quality gates (Prettier, Knip, Semgrep, ESLint/Sonar), jscpd cap, rust-cache on desktop; ESLint patterns on e2e/tooling.

## [0.2.3] - 2026-03-22

- Checklist Lexical (Entrée, Tab, markdown) ; couverture Vitest et e2e Playwright alignés.

## [0.2.2] - 2026-03-22

- ESLint 10, Vite 8, Vitest 4, Zod 4, better-sqlite3 12; expanded web tests and coverage gate; Dependabot grouping and CI fixes.

## [0.2.1] - 2026-03-21

- Desktop macOS: signed bundle + DMG from CI (ad-hoc codesign, tauri.macos.conf).

## [0.2.0] - 2026-03-21

- Desktop app (Tauri + embedded Node): macOS, Windows, Linux builds on GitHub Releases.

## [0.1.9] - 2026-03-21

- Playwright: API-seeded UI specs (task-seeded-ui), area-ui-journey, shared area footer helpers; createTaskViaApi/putTaskViaApi; docs: releasing via Actions only.

## [0.1.8] - 2026-03-21

- CI: auto-dispatch Docker image after release; patch bump.

## [0.1.7] - 2026-03-21

- Refactoring santé du code (parseDateKey, footer, duplication, docs qualité).

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

[Unreleased]: https://github.com/OpenClaudeAgent/BlueTasks/compare/v0.2.4...HEAD
[0.2.4]: https://github.com/OpenClaudeAgent/BlueTasks/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/OpenClaudeAgent/BlueTasks/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/OpenClaudeAgent/BlueTasks/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/OpenClaudeAgent/BlueTasks/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/OpenClaudeAgent/BlueTasks/compare/v0.1.9...v0.2.0
[0.1.9]: https://github.com/OpenClaudeAgent/BlueTasks/compare/v0.1.8...v0.1.9
[0.1.8]: https://github.com/OpenClaudeAgent/BlueTasks/compare/v0.1.7...v0.1.8
[0.1.7]: https://github.com/OpenClaudeAgent/BlueTasks/compare/v0.1.6...v0.1.7
[0.1.6]: https://github.com/OpenClaudeAgent/BlueTasks/compare/v0.1.5...v0.1.6
[0.1.5]: https://github.com/OpenClaudeAgent/BlueTasks/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/OpenClaudeAgent/BlueTasks/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/OpenClaudeAgent/BlueTasks/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/OpenClaudeAgent/BlueTasks/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/OpenClaudeAgent/BlueTasks/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/OpenClaudeAgent/BlueTasks/releases/tag/v0.1.0
