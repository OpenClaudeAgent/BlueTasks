# Changelog

All notable changes to this project are documented here. Docker images are published to `ghcr.io/<owner>/bluetasks` when a `v*` tag is pushed (see [docs/docker.md](docs/docker.md)).

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [0.2.5] - 2026-03-22

- Task delete: Radix alert dialog (replaces native confirm); a11y contrast + tests (e2e, Vitest, axe); e2e resetBoard dedupe; delete button aria-label.

## [0.2.4] - 2026-03-22

- Axe a11y e2e and UI fixes; Playwright helpers for jscpd; Settings import strict-mode locator; CI tooling (Knip, Prettier).

## [0.2.3] - 2026-03-22

- Checklist Lexical (Entrée, Tab, markdown) ; couverture Vitest et e2e Playwright alignés.
- Tooling: CI quality gates (Prettier, Knip, Semgrep, ESLint/Sonar), jscpd cap, rust-cache on desktop; ESLint patterns on e2e/tooling.

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

[Unreleased]: https://github.com/OpenClaudeAgent/BlueTasks/compare/v0.2.5...HEAD
[0.2.5]: https://github.com/OpenClaudeAgent/BlueTasks/compare/v0.2.4...v0.2.5
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
