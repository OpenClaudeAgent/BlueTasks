# Continuous quality (BlueTasks)

## Local commands

| Command | Role |
|--------|------|
| `npm run lint` | Runs all of: `lint:eslint-web` → `lint:stylelint` → `lint:eslint-server` → `lint:eslint-scenario` (same split as CI jobs) |
| `npm run lint:eslint-web` | **ESLint** — web only (TS, React Hooks, **jsx-a11y**; **Vitest** + **Testing Library** on `*.test.*` only) |
| `npm run lint:stylelint` | **Stylelint** — `web/app/src/**/*.css` |
| `npm run lint:eslint-server` | **ESLint** — server (TS + **Vitest** on `*.test.ts`) |
| `npm run lint:eslint-scenario` | **ESLint** — Playwright rules on [`scenario/`](../scenario/) ([`eslint.scenario.config.mjs`](../eslint.scenario.config.mjs)) |
| `npm run test` | Vitest — **web** (`src/lib` + **RTL** on `SettingsDialog`) + **server** (sanitize, HTTP API, `dbSetup`, icons) |
| `npm run test:coverage` | Vitest with the broader web thresholds ([`web/app/vitest.config.ts`](../web/app/vitest.config.ts)) |
| `npm run test:coverage:gate` | **CI gate — ≥80%** lines, statements, branches, functions on [`web/app/src/lib/**`](../web/app/src/lib) and on [`server/src/**`](../server/src) except `index.ts` ([gate configs](../web/app/vitest.coverage-gate.config.ts)) |
| `npm run duplicates` | [jscpd](https://github.com/kucherenko/jscpd) — copy-paste clones (global threshold in `.jscpd.json`) |
| `npm run test:scenario` | Playwright — built SPA + real server ([`scenario/`](../scenario/), [`playwright.config.ts`](../playwright.config.ts)); locally full suite. **CI** splits with `--shard=1/2` and `--shard=2/2` (two isolated runners; see [testing-strategy.md](testing-strategy.md#end-to-end)) |
| `npm run semgrep:docker` | **Semgrep** — same as CI: (1) whole [`web/app/`](../web/app/) with `p/typescript` + `p/react` (Vite/Vitest configs + `src/`, not only `src/`), (2) [`server/`](../server/) + [`contract/`](../contract/) + [`scenario/`](../scenario/) + [`scripts/`](../scripts/) + root `playwright.config.ts` + `eslint.*.config.mjs` with `p/typescript` only (Docker) |
| `npm run ci` | `lint` → `duplicates` → **`test:coverage:gate`** → `build` → `test:scenario` (does **not** run Semgrep — use `semgrep:docker` locally; CI runs Semgrep in its own job) |
| `npm run check` | Alias for `ci` |

## GitHub Actions CI

Workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs on Node 22. **Quality checks are separate jobs** (each appears as its own row in the Actions UI): **ESLint (web)**, **Stylelint (web CSS)**, **ESLint (server)**, **ESLint (Playwright scenario)**, **ESLint (contract, scripts, Playwright config)**, **Duplication (jscpd)**, **Semgrep** (Docker: two scans — full `web/app` with TS+React rules, then `server` + `contract` + `scenario` + `scripts` + root ESLint/Playwright configs with TS only), then **Tests & coverage**, **Production build**, **Scenario tests (Playwright)**. They run in parallel where GitHub schedules them; **any failed job marks the workflow run as failed** (steps use the default `continue-on-error: false`). Run manually via **Actions → CI → Run workflow**.

Semgrep only reports **files it actually analyzes** (tracked by git, matching rule languages). A small tree like `contract/` has few files, so a low “N files” count there is expected, not a sign that other folders were skipped.

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
