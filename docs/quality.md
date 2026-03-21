# Continuous quality (BlueTasks)

## Local commands

| Command | Role |
|--------|------|
| `npm run lint` | ESLint on the **web app** (TypeScript + React Hooks + **jsx-a11y**) then on the **server** (TypeScript, Node) |
| `npm run test` | Vitest — **web** (`src/lib` + **RTL** on `SettingsDialog`) + **server** (sanitize, HTTP API, `dbSetup`, icons) |
| `npm run test:coverage` | Vitest with the broader web thresholds ([`web/app/vitest.config.ts`](../web/app/vitest.config.ts)) |
| `npm run test:coverage:gate` | **CI gate — ≥80%** lines, statements, branches, functions on [`web/app/src/lib/**`](../web/app/src/lib) and on [`server/src/**`](../server/src) except `index.ts` ([gate configs](../web/app/vitest.coverage-gate.config.ts)) |
| `npm run duplicates` | [jscpd](https://github.com/kucherenko/jscpd) — copy-paste clones (global threshold in `.jscpd.json`) |
| `npm run test:e2e` | Playwright — built SPA + real server ([`e2e/`](../e2e/), [`playwright.config.ts`](../playwright.config.ts)) |
| `npm run ci` | `lint` → `duplicates` → **`test:coverage:gate`** → `build` → `test:e2e` |
| `npm run check` | Alias for `ci` |

## GitHub Actions CI

Workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs the same steps as `npm run ci` on Node 22, split across **parallel** jobs (`lint` includes ESLint + jscpd; `test` runs **`npm run test:coverage:gate`** and uploads `coverage-gate/` summaries; `build` runs the production build; **`e2e`** runs Playwright). You can also run it manually via **Actions → CI → Run workflow**.

To mirror this in another repository (e.g. **OpenClaudeAgent/open-flow**), copy the same pattern: a dedicated Vitest config with `coverage.thresholds` at **80** and a CI step that runs `npm run test:coverage:gate` (or your package manager equivalent).

**BDD layers and what to test where**: [testing-strategy.md](testing-strategy.md).

Related checks:

- **[Docker build check](../.github/workflows/docker-build-check.yml)** — on pull requests that touch Docker/build inputs, verifies the `.dockerctx` image builds for `linux/amd64` (nothing is pushed).
- **[Docker image](../.github/workflows/docker-publish.yml)** — builds and pushes multi-arch images on `v*` tags or manual dispatch with a tag input.
- **[Release](../.github/workflows/release.yml)** — `workflow_dispatch` with a semver input: syncs all workspace `package.json` versions, updates `CHANGELOG.md`, refreshes the lockfile, commits, and pushes `v*` (starts Docker publish). See [releasing.md](releasing.md).

## Front-end coverage strategy

- **`src/lib/**`**: core logic (main thresholds).
- **`SettingsDialog.tsx`**: first component covered with **@testing-library/react** (`src/test/setup.ts` + `@vitest-environment jsdom` on relevant `*.test.tsx`).
- To expand: add RTL tests and extend `coverage.include` in [`web/app/vitest.config.ts`](../web/app/vitest.config.ts).

## Server

- Validation logic lives in [`server/src/taskSanitize.ts`](../server/src/taskSanitize.ts) (unit tests).
- HTTP app is injectable via [`server/src/createApp.ts`](../server/src/createApp.ts) + in-memory DB for integration tests (`supertest`).
