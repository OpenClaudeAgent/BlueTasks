# Continuous quality (BlueTasks)

## Local commands

| Command | Role |
|--------|------|
| `npm run lint` | ESLint on the **web app** (TypeScript + React Hooks + **jsx-a11y**) then on the **server** (TypeScript, Node) |
| `npm run test` | Vitest — **web** (`src/lib` + **RTL** on `SettingsDialog`) + **server** (sanitize, HTTP API, `dbSetup`, icons) |
| `npm run test:coverage` | Vitest with the broader web thresholds ([`web/app/vitest.config.ts`](../web/app/vitest.config.ts)) |
| `npm run test:coverage:gate` | **CI gate — ≥80%** lines, statements, branches, functions on [`web/app/src/lib/**`](../web/app/src/lib) and on [`server/src/**`](../server/src) except `index.ts` ([gate configs](../web/app/vitest.coverage-gate.config.ts)) |
| `npm run duplicates` | [jscpd](https://github.com/kucherenko/jscpd) — copy-paste clones (global threshold in `.jscpd.json`) |
| `npm run test:scenario` | Playwright — built SPA + real server ([`scenario/`](../scenario/), [`playwright.config.ts`](../playwright.config.ts)) |
| `npm run ci` | `lint` → `duplicates` → **`test:coverage:gate`** → `build` → `test:scenario` |
| `npm run check` | Alias for `ci` |

## GitHub Actions CI

Workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs the same steps as `npm run ci` on Node 22, split across **parallel** jobs (`lint` includes ESLint + jscpd; `test` runs **`npm run test:coverage:gate`** and uploads `coverage-gate/` summaries; `build` runs the production build; **`scenario`** runs Playwright). You can also run it manually via **Actions → CI → Run workflow**.

To mirror this in another repository (e.g. **OpenClaudeAgent/open-flow**), copy the same pattern: a dedicated Vitest config with `coverage.thresholds` at **80** and a CI step that runs `npm run test:coverage:gate` (or your package manager equivalent).

**BDD layers and what to test where**: [testing-strategy.md](testing-strategy.md).

Related workflows:

- **[Docker image](../.github/workflows/docker-publish.yml)** — multi-arch **build** and **push** to GHCR on `v*` tag or manual dispatch (image tag input).
- **[Release](../.github/workflows/release.yml)** — manual `workflow_dispatch` with a semver: syncs workspace `package.json` files, updates `CHANGELOG.md`, refreshes the lockfile, commits, pushes `v*` (then run **Docker image** as documented in [releasing.md](releasing.md)).

## Front-end coverage strategy

- **`src/lib/**`**: core logic (main thresholds).
- **`SettingsDialog.tsx`**: first component covered with **@testing-library/react** (`src/test/setup.ts` + `@vitest-environment jsdom` on relevant `*.test.tsx`).
- To expand: add RTL tests and extend `coverage.include` in [`web/app/vitest.config.ts`](../web/app/vitest.config.ts).

## Server

- Validation logic lives in [`server/src/taskSanitize.ts`](../server/src/taskSanitize.ts) (unit tests).
- HTTP app is injectable via [`server/src/createApp.ts`](../server/src/createApp.ts) + in-memory DB for integration tests (`supertest`).
