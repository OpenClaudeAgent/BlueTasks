# Testing strategy (BDD-style layers)

We describe behaviour with **Feature → Scenario → Given / When / Then** (Gherkin-style thinking) and map each scenario to the **lowest layer** that gives enough confidence without duplication.

| Layer | Scope | Tools | When to use |
|--------|--------|--------|-------------|
| **Unit** | Pure logic, small helpers, domain rules | Vitest (`node` or `jsdom`) | Fast feedback; no I/O; stable contracts |
| **Integration** | HTTP API + DB (or React + mocked boundaries) | Vitest + `supertest`; RTL + `vi.mock` for `fetch`/modules | Verify wiring, serializers, persistence, critical UI flows |
| **End-to-end (E2E)** | Full stack: built SPA + real server | Playwright | Main user paths, regressions across static serving + API |

Avoid repeating the same assertion at every layer: e.g. task sorting rules stay in **unit** tests; **E2E** checks that the app loads and core endpoints respond.

---

## Strong assertions (contracts over “truthiness”)

Prefer checks that pin **behaviour and shape** to the code under test:

- **HTTP**: status code, `Content-Type`, exact error payloads (`{ message: '…' }`), binary magic bytes when relevant.
- **JSON**: `toEqual` / `toMatchObject` on nested fields instead of `toBeTruthy()` or “key exists” alone.
- **DOM**: `getByRole` + accessible name, `toHaveClass` for state hooks (`is-expanded`), `instanceof` for the element type — not only `querySelector` + truthy.
- **Mocks**: `toHaveBeenCalledWith(…)` (URL, method, body) rather than “called once” with no arguments.

Shallow patterns (`toBeTruthy`, bare `toBeDefined`, `Array.isArray` without element checks) are acceptable only as a **supplement** when a stronger assertion already covers the contract.

**Do not** encode type unions as a single boolean passed to `expect(…).toBe(true)` (e.g. `expect(x === null || typeof x === 'string').toBe(true)`). That almost never fails in a useful way. Prefer explicit branches: `expect(x).toBeNull()` / `expect(x).toMatch(…)` / `expect(array).toContain(x)` / `expect(x).toMatch(uuidRegex)`.

---

## Naming convention (BDD)

In Vitest, use nested `describe` blocks to mirror features and scenarios:

```text
describe('Feature: Task card time display', () => {
  describe('Scenario: Timer is running', () => {
    it('given timerStartedAt and now ahead by 5s, when formatTrackedSeconds runs, then base increases by 5', () => {
      // ...
    });
  });
});
```

`it(...)` is the **Then**; the description carries **Given** and **When** in one sentence. This stays readable without a Gherkin parser.

---

## What to test where (BlueTasks)

### Unit

- **Date / sections**: [`web/app/src/lib/date.ts`](../web/app/src/lib/date.test.ts), [`tasks.ts`](../web/app/src/lib/tasks.test.ts) (filtering, sorting, payloads).
- **Recurrence / editor JSON**: [`recurrence.ts`](../web/app/src/lib/recurrence.test.ts), [`editorState.ts`](../web/app/src/lib/editorState.test.ts).
- **Task card formatting** (extracted from UI): [`taskCardFormat.ts`](../web/app/src/lib/taskCardFormat.ts) — timer display, estimate labels, priority cycle.
- **Server validation**: [`taskSanitize.ts`](../server/src/taskSanitize.test.ts), [`areaIconIds.ts`](../server/src/areaIconIds.test.ts).

### Integration

- **REST API + SQLite (memory or temp file)**: [`server/src/api.integration.test.ts`](../server/src/api.integration.test.ts), [`dbSetup.test.ts`](../server/src/dbSetup.test.ts).
- **Public API JSON (Zod)**: [`contract/`](../contract/) — Vitest ([`server/src/api.integration.test.helpers.ts`](../server/src/api.integration.test.helpers.ts)); Playwright ([`scenario/contract-expectations.ts`](../scenario/contract-expectations.ts)).
- **Client API wrapper**: [`web/app/src/api.test.ts`](../web/app/src/api.test.ts).
- **Components (RTL)**: settings, language toggle, task row behaviour with i18n — [`SettingsDialog.test.tsx`](../web/app/src/components/SettingsDialog.test.tsx), [`LanguageSwitcher.test.tsx`](../web/app/src/components/LanguageSwitcher.test.tsx), [`TaskCard.test.tsx`](../web/app/src/components/TaskCard.test.tsx) (mock heavy editors).

### End-to-end

- **Scenario tests (browser)**: Playwright under [`scenario/`](../scenario/) — [`api.production.spec.ts`](../scenario/api.production.spec.ts) (HTTP against the live build), [`app-shell.spec.ts`](../scenario/app-shell.spec.ts) (initial load, SPA fallback), [`task-lifecycle.spec.ts`](../scenario/task-lifecycle.spec.ts) (tasks UI), [`navigation-settings.spec.ts`](../scenario/navigation-settings.spec.ts), [`editor-toolbar.spec.ts`](../scenario/editor-toolbar.spec.ts) (Lexical toolbar: bold, italic, lists, table, markdown `[] `, etc.); shared helpers [`scenario/helpers.ts`](../scenario/helpers.ts), [`scenario/api-helpers.ts`](../scenario/api-helpers.ts), [`scenario/task-flow-helpers.ts`](../scenario/task-flow-helpers.ts) (see [`playwright.config.ts`](../playwright.config.ts)). Further specs cover estimates, recurrence, timer, areas, settings, quick capture, Upcoming, and filters.

**Parallelism:** [`playwright.config.ts`](../playwright.config.ts) uses **`workers: 1`** by default. The E2E server shares one SQLite file; raising workers on a single job would interleave tests against the same DB and cause **flaky** failures. **CI** runs the suite in **two shards** (`playwright test --shard=1/2` and `--shard=2/2`) as separate jobs — each runner has its own server and DB, so wall-clock time improves without cross-test races. Optional override: `PLAYWRIGHT_WORKERS` (use only if you understand the tradeoff).

Add more E2E only for flows that **integration tests cannot trust** (e.g. full OAuth, file upload across browsers). Prefer **integration** tests for business rules; E2E should stay a **focused** set of real user paths, not a duplicate of every unit test.

---

## Coverage policy

- **Pipeline gate (80%)**: `npm run test:coverage:gate` uses [`web/app/vitest.coverage-gate.config.ts`](../web/app/vitest.coverage-gate.config.ts) ( **`src/lib/**` only** on the web) and [`server/vitest.coverage-gate.config.ts`](../server/vitest.coverage-gate.config.ts) (all server `src/**` except `index.ts`). Fails CI if any metric drops below **80%**.
- **Broader report** (optional locally): `npm run test:coverage` still uses [`web/app/vitest.config.ts`](../web/app/vitest.config.ts) with extra UI files in the report and lower thresholds.

Coverage is a **guardrail**, not the goal: prefer scenarios that document behaviour (BDD titles) over chasing 100% on UI shells.

---

## Commands

| Command | Purpose |
|---------|---------|
| `npm run test` | All Vitest unit/integration (web + server) |
| `npm run test:coverage` | Vitest + coverage (broader web scope, softer thresholds) |
| `npm run test:coverage:gate` | **≥80%** gate (web `src/lib/**` + full server `src/`) |
| `npm run test:scenario` | Playwright scenario suite (starts `npm run build` + `npm run start` unless reusing a server) |
| `npm run ci` | Lint, jscpd, **coverage gate**, production build, scenario tests |

---

## CI

- **CI workflow**: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — parallel jobs for lint, tests + coverage, build, and **scenario tests** (Chromium + system deps on Ubuntu).

New features follow the same layers: add unit, integration, or scenario tests alongside the code; prefer the lightest layer that still proves the behaviour.
