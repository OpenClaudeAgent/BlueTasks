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
| `npm run test:coverage:gate` | **CI gate** — web: almost all [`web/app/src/`](../web/app/src/) (see [gate config](../web/app/vitest.coverage-gate.config.ts) exclusions); server: [`server/src/**`](../server/src) except `index.ts`. New tests should follow **behaviour-first BDD** ([testing-strategy.md](testing-strategy.md#behaviour-first-not-tests-for-tests)), not coverage for its own sake. |
| `npm run duplicates` | [jscpd](https://github.com/kucherenko/jscpd) — copy-paste clones (threshold in [`.jscpd.json`](../.jscpd.json)); writes an **HTML drill-down** under `jscpd-report/html/` (gitignored) alongside console output |
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
- HTTP app is wired in [`server/src/createApp.ts`](../server/src/createApp.ts) (mounts [`server/src/routes/`](../server/src/routes/) — tasks, areas, import/export) + in-memory DB for integration tests (`supertest`).

## Module layout and import-cycle goals

### API contract checks

- Shared Zod contract assertions live in [`contract/api-contract-validation.ts`](../contract/api-contract-validation.ts) (`assertApiTaskRowContract`, `assertApiAreaRowContract`).
- Playwright ([`scenario/contract-expectations.ts`](../scenario/contract-expectations.ts)) and Vitest ([`server/src/api.integration.test.helpers.ts`](../server/src/api.integration.test.helpers.ts)) re-export those assertions as `expectApiTaskRow` / `expectApiAreaRow` for stable import paths; they must not duplicate `parse` logic.

### Task property coercion (web)

- Normalisation of pinned / recurrence from API or SQLite shapes lives in [`web/app/src/lib/taskPropertyValidation.ts`](../web/app/src/lib/taskPropertyValidation.ts). [`web/app/src/lib/tasks.ts`](../web/app/src/lib/tasks.ts) re-exports for backward compatibility.

### TaskCard derived values

- Shared pure helpers for the task card (for example `areaNameByIdMap`, checklist ratio) belong in [`web/app/src/components/taskCard/taskCardModel.ts`](../web/app/src/components/taskCard/taskCardModel.ts). When splitting footer pickers into subcomponents, import from here rather than introducing a second model module or duplicating maps.

### RPG / dependency-cycle KPIs

- **Target**: eliminate **utility-to-utility** cycles (for example a layered `lib/date`: parsing → arithmetic → recurrence). Health tools should trend toward **zero** cycles inside pure `lib/` and `contract/` code after refactors.
- **Acceptable residual**: some **UI ↔ lib** edges may remain (components importing date/format helpers). A small cross-file count there is acceptable unless it causes load-order or bundling issues; prioritise breaking cycles inside shared libraries first.
