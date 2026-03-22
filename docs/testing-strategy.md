# Testing strategy (BDD-style layers)

We describe behaviour with **Feature → Scenario → Given / When / Then** (Gherkin-style thinking) and map each scenario to the **lowest layer** that gives enough confidence without duplication.

## Behaviour first (not “tests for tests”)

Every test should defend a **behaviour someone cares about** (user journey, API contract, or invariant), and the title should make that obvious.

- **Before adding a test**, name the behaviour: e.g. “quick capture on Today assigns today’s date”, “export DB triggers download with server filename”, “invalid area filter resets to All”.
- **Do not** add cases whose only goal is to raise a coverage percentage, or vague examples (`it('works')`, `it('renders')` without a stated outcome). If coverage is low on a file, treat that as a **backlog of behaviours** to specify (often already partially covered by Playwright under [`e2e/`](../e2e/)), not as a prompt to touch arbitrary lines.
- **Coverage gates** ([`vitest.coverage-gate.config.ts`](../web/app/vitest.coverage-gate.config.ts)) are a **regression guardrail**: they catch accidental deletion of exercised paths. They do **not** replace a clear scenario list. When a gate and “100% behaviour coverage” disagree, **behaviour and docs win**; then we either add a real scenario or accept a documented exclusion.

---

| Layer                | Scope                                        | Tools                                                     | When to use                                                |
| -------------------- | -------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------- |
| **Unit**             | Pure logic, small helpers, domain rules      | Vitest (`node` or `jsdom`)                                | Fast feedback; no I/O; stable contracts                    |
| **Integration**      | HTTP API + DB (or React + mocked boundaries) | Vitest + `supertest`; RTL + `vi.mock` for `fetch`/modules | Verify wiring, serializers, persistence, critical UI flows |
| **End-to-end (E2E)** | Full stack: built SPA + real server          | Playwright                                                | Main user paths, regressions across static serving + API   |

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

- **Date / sections**: [`web/app/src/lib/dateFormat.ts`](../web/app/src/lib/dateFormat.test.ts), [`tasks.ts`](../web/app/src/lib/tasks.test.ts) (filtering, sorting, payloads), [`taskRecurrence.ts`](../web/app/src/lib/taskRecurrence.test.ts).
- **Recurrence / editor JSON**: [`recurrence.ts`](../web/app/src/lib/recurrence.test.ts), [`editorState.ts`](../web/app/src/lib/editorState.test.ts).
- **Task card formatting** (extracted from UI): [`taskCardFormat.ts`](../web/app/src/lib/taskCardFormat.ts) — timer display, estimate labels, priority cycle.
- **Server validation**: [`taskSanitize.ts`](../server/src/taskSanitize.test.ts), [`areaIconIds.ts`](../server/src/areaIconIds.test.ts).

### Integration

- **REST API + SQLite (memory or temp file)**: [`server/src/api.integration.test.ts`](../server/src/api.integration.test.ts), [`dbSetup.test.ts`](../server/src/dbSetup.test.ts).
- **Public API JSON (Zod)**: [`contract/`](../contract/) — Vitest ([`server/src/api.integration.test.helpers.ts`](../server/src/api.integration.test.helpers.ts)); Playwright ([`e2e/contract-expectations.ts`](../e2e/contract-expectations.ts)).
- **Client API wrapper**: [`web/app/src/api.test.ts`](../web/app/src/api.test.ts).
- **Components (RTL)**: settings, language toggle, task row behaviour with i18n — [`SettingsDialog.test.tsx`](../web/app/src/components/SettingsDialog.test.tsx), [`LanguageSwitcher.test.tsx`](../web/app/src/components/LanguageSwitcher.test.tsx), [`TaskCard.test.tsx`](../web/app/src/components/TaskCard.test.tsx) (mock heavy editors), [`useTaskCardChrome.test.tsx`](../web/app/src/components/taskCard/useTaskCardChrome.test.tsx) (task card chrome hook).

### End-to-end

- **E2E tests (browser)**: Playwright under [`e2e/`](../e2e/) — [`api.production.spec.ts`](../e2e/api.production.spec.ts) (**contract only**: HTTP against the live build, no `page`; shared JSON helpers in [`api-production-helpers.ts`](../e2e/api-production-helpers.ts)). All **other** E2E specs must exercise the **UI** (`page`, roles, visible state); the API may **seed** state (`POST`/`PUT` then `reload`) when that keeps tests fast and stable — see [`task-seeded-ui.spec.ts`](../e2e/task-seeded-ui.spec.ts). Also: [`app-shell.spec.ts`](../e2e/app-shell.spec.ts) (initial load, SPA fallback), [`task-lifecycle.spec.ts`](../e2e/task-lifecycle.spec.ts), [`navigation-settings.spec.ts`](../e2e/navigation-settings.spec.ts), [`settings-export.spec.ts`](../e2e/settings-export.spec.ts), [`editor-toolbar.spec.ts`](../e2e/editor-toolbar.spec.ts) (plus [`editor-toolbar-helpers.ts`](../e2e/editor-toolbar-helpers.ts)); shared helpers [`e2e/helpers.ts`](../e2e/helpers.ts), [`e2e/api-helpers.ts`](../e2e/api-helpers.ts), [`e2e/task-flow-helpers.ts`](../e2e/task-flow-helpers.ts) (see [`playwright.config.ts`](../playwright.config.ts)). Further specs cover estimates, recurrence, timer, areas, settings, language/import, quick capture, Upcoming, filters, and [`area-ui-journey.spec.ts`](../e2e/area-ui-journey.spec.ts) (areas created entirely through the UI).

**Parallelism:** [`playwright.config.ts`](../playwright.config.ts) uses **`workers: 1`** by default. The E2E server shares one SQLite file; raising workers on a single job would interleave tests against the same DB and cause **flaky** failures. **CI** runs the suite in **two shards** (`playwright test --shard=1/2` and `--shard=2/2`) as separate jobs — each runner has its own server and DB, so wall-clock time improves without cross-test races. Optional override: `PLAYWRIGHT_WORKERS` (use only if you understand the tradeoff).

Add more E2E only for flows that **integration tests cannot trust** (e.g. full OAuth, file upload across browsers). Prefer **integration** tests for business rules; E2E should stay a **focused** set of real user paths, not a duplicate of every unit test.

---

## Coverage policy

- **Web pipeline gate**: [`web/app/vitest.coverage-gate.config.ts`](../web/app/vitest.coverage-gate.config.ts) measures almost all of [`web/app/src/`](../web/app/src/) (see file header for exclusions such as `LexicalTaskEditor.tsx`, `main.tsx`, `i18n.ts`, locales, types). **Lines and statements** must stay ≥ **80%**. **Branches** and **functions** use slightly lower floors because v8 counts many JSX callbacks separately; closing those gaps should still be done via **named behaviours** (see § Behaviour first), not anonymous smoke tests.
- **Server pipeline gate**: [`server/vitest.coverage-gate.config.ts`](../server/vitest.coverage-gate.config.ts) — all of `server/src/**` except `index.ts`, thresholds **80%** on lines, statements, branches, functions.
- **Broader report** (optional locally): `npm run test:coverage` uses [`web/app/vitest.config.ts`](../web/app/vitest.config.ts) with a wider UI include list and softer thresholds for exploration.

Coverage is a **guardrail**, not the goal: prefer scenarios that document behaviour (BDD titles) over chasing 100% on UI shells or inflating metrics without a story.

---

## Commands

| Command                      | Purpose                                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `npm run test`               | All Vitest unit/integration (web + server)                                                                                |
| `npm run test:coverage`      | Vitest + coverage (broader web scope, softer thresholds)                                                                  |
| `npm run test:coverage:gate` | Web gate (almost full `web/app/src/`, see config exclusions) + server `src/**` (except `index.ts`); see § Coverage policy |
| `npm run test:scenario`      | Playwright E2E suite under `e2e/` (starts `npm run build` + `npm run start` unless reusing a server)                      |
| `npm run ci`                 | Lint, jscpd, **coverage gate**, production build, Playwright E2E tests                                                    |

---

## CI

- **CI workflow**: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — parallel jobs for lint, tests + coverage, build, and **E2E tests** (Chromium + system deps on Ubuntu).

New features follow the same layers: add unit, integration, or scenario tests alongside the code; prefer the lightest layer that still proves the behaviour.
