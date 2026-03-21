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
- **Client API wrapper**: [`web/app/src/api.test.ts`](../web/app/src/api.test.ts).
- **Components (RTL)**: settings and task row behaviour with i18n — [`SettingsDialog.test.tsx`](../web/app/src/components/SettingsDialog.test.tsx), [`TaskCard.test.tsx`](../web/app/src/components/TaskCard.test.tsx) (mock heavy editors).

### End-to-end

- **Production-shaped server**: [`e2e/app.spec.ts`](../e2e/app.spec.ts) — `GET /api/tasks` and `/` with built assets (see [`playwright.config.ts`](../playwright.config.ts)).

Expand E2E only for flows that **integration tests cannot trust** (e.g. full OAuth, file upload across browsers). Prefer more **integration** tests for business rules. The Playwright suite stays intentionally small: it checks that the built app and API respond, not every UI interaction.

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
| `npm run test:e2e` | Playwright (starts `npm run build` + `npm run start` unless reusing a server) |
| `npm run ci` | Lint, jscpd, **coverage gate**, production build, E2E |

---

## CI

- **CI workflow**: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — parallel jobs for lint, tests + coverage, build, and **E2E** (Chromium + system deps on Ubuntu).

---

## Backlog ideas (prioritised)

1. **Hook integration test**: `useBlueTasksBoard` with mocked `tasksApi` / `areasApi` (debounced save, error path).
2. **Server**: extra API cases (import/export boundaries) if not already covered.
3. **E2E**: second scenario “create task via UI” once stable selectors / `data-testid` policy exists.
4. Optional **Gherkin files** + cucumber runner only if the team wants non-developers to author scenarios — not required today.
