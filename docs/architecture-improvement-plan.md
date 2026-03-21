# Architecture improvement plan

Working document: phased goals, deliverables, and how we measure progress. Update this file when scope changes or a milestone ships.

---

## Current status (repository snapshot)

| Item | Status | Notes |
|------|--------|--------|
| French → English in hot-path code comments (`createApp.ts`, `editorState.ts`, Docker files) | Done | Broader doc translation (e.g. `docs/architecture.md`) optional |
| Server coverage gate + `expectApiTaskRow` contract tests | Done | [`server/vitest.coverage-gate.config.ts`](../server/vitest.coverage-gate.config.ts), [`server/src/api.integration.test.ts`](../server/src/api.integration.test.ts) |
| Split board hook: `useBlueTasksUiState` + `useBlueTasksTasksAndSaves` | Done | [`web/app/src/hooks/blueTasks/`](../web/app/src/hooks/blueTasks/), thin [`useBlueTasksBoard.ts`](../web/app/src/hooks/useBlueTasksBoard.ts) |
| CI naming (“Docker build check”, no “smoke” jargon) | Done | [`.github/workflows/docker-build-check.yml`](../.github/workflows/docker-build-check.yml) |
| Playwright: real user flows (not only “app loads”) | Done | [`e2e/bluetasks.spec.ts`](../e2e/bluetasks.spec.ts), [`e2e/helpers.ts`](../e2e/helpers.ts) |
| `lib/formatting/` tree (dates + task card formatters) | Not started | Optional refactor; see Phase 2.1 |
| ESLint / dependency DAG enforcement | Not started | Optional; see Phase 3 |
| Formal cycle baseline in repo | Not started | Run tooling below and paste results + date into [Metrics](#metrics) |

---

## Reality check (before large refactors)

1. **Hooks alone do not remove TypeScript import cycles.** If `TaskCard` imports `tasks` and `tasks` imports `editorState`, the graph stays cyclic until code moves or a dependency is inverted (pure types, facades, injection). Extracting `useBlueTasksBoard` improves readability and test seams; it does not rewrite the module graph by itself.

2. **`filterTasks` / `sortTasks` in one file** are not a “mutual dependency bug”; cycle tools still count long paths through that module. Focus on **UI ↔ domain** edges, not splitting two exports in the same file.

3. **Strict DAG tooling** (e.g. dependency plugins) is valuable but expensive to adopt in one step. Prefer incremental rules (forbid specific `components/` → `lib/` imports) or manual review first.

4. **Cycle counts are only comparable** if the same tool, entry files, and ignores are used each time. Record the exact command in [Metrics](#metrics).

---

## Phase 1 — Critical hygiene

### 1.1 Comments and developer-facing copy

- **Goal**: Technical comments and Docker/CI wording in English where developers look first.
- **Status**: Done for identified server/web/Docker hotspots; periodic grep for non-English in `src/` optional.

### 1.2 Cross-file cycle analysis (root cause)

- **Goal**: Named list of top cycles (e.g. top 10) and whether each is benign (re-exports) or worth breaking.
- **Effort**: ~2 h once tooling is chosen.
- **Deliverable**: Exported graph or text report committed under `docs/` *or* pasted into [Metrics](#metrics) with date + command.

**Suggested commands** (pick one and standardize):

```bash
# Example: madge (install devDependency or use npx)
npx madge --circular --extensions ts,tsx web/app/src

# Example: dependency-cruiser (config can exclude tests)
npx depcruise --config .dependency-cruiser.js web/app/src
```

*(No tool is wired in CI yet; adding one is optional and should not block feature work.)*

---

## Phase 2 — Dependency decoupling (optional, incremental)

### 2.1 Pure utility layer

- Group **formatting** (dates, duration labels, icons map) under something like `web/app/src/lib/formatting/` with **no** imports from `components/`.
- **Success**: `rg "from '\\.\\./components" web/app/src/lib/formatting` returns nothing.

### 2.2 UI vs domain

- Keep domain logic in `lib/` and hooks; components stay mostly presentation. Further extractions only where it reduces cycles or duplication.

### 2.3 Board state decomposition

- **Status**: First increment done (`useBlueTasksUiState`, `useBlueTasksTasksAndSaves`). Further splits (e.g. dedicated areas hook) only if a clear pain appears.

---

## Phase 3 — Structure & enforcement (optional)

- Target mental model: **Utilities → types/models → domain (`lib/`) → hooks → components → API client**.
- **Enforcement**: ESLint `no-restricted-imports` zones or a dependency plugin, rolled out file-by-file.

---

## Phase 4 — Validation

- Re-run cycle detection after meaningful refactors; compare to the last saved baseline.
- Keep **`npm run test`**, **`npm run test:coverage:gate`**, and **`npm run test:e2e`** green on `main` (see [testing-strategy.md](testing-strategy.md)).
- Optional: compare production bundle size / build time before vs after large moves.

---

## Quick wins (ordered)

1. ~~Comment / Docker English pass~~ — done for scoped files.
2. ~~Split `useBlueTasksBoard`~~ — done (see snapshot table).
3. Next optional: **`lib/formatting/`** in a single small PR (move + re-export to limit churn).
4. Next optional: **one** cycle baseline commit in [Metrics](#metrics).

---

## Risks

- **Component API churn** — prefer small PRs and temporary wrappers.
- **Performance** — spot-check bundle and one critical interaction after refactors.
- **Hook edge cases** — rely on existing Vitest + Playwright coverage; add tests when extracting new hooks.

---

## Metrics

Fill when you baseline; do not erase history—append a dated row.

| Date | Tool & command | Cross-file cycles | Max cycle length | Notes |
|------|----------------|-------------------|------------------|--------|
| — | *e.g. `npx madge --circular web/app/src`* | *TBD* | *TBD* | Initial RPG-style report cited “48 cycles / 17 files”; re-verify with chosen tool. |

**Targets (indicative, not CI-gated today)**

| Metric | Indicative target | When |
|--------|-------------------|------|
| Cross-file cycles | Lower than baseline; no single huge cluster | After Phase 2 increments |
| Utility layer | No `components` imports under `lib/formatting/**` | Phase 2.1 |
| Tests + coverage gate | Green | Every PR |

---

## Document history

| Change | Summary |
|--------|---------|
| 2026-03 | Plan created from cycle/RPG analysis; French draft |
| 2026-03 | Finalized: English, completed-work table, metrics template, tooling hints, phased backlog |
