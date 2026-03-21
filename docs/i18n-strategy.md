# Internationalization (i18n)

## Supported locales

- English
- French

All user-visible strings live in `web/app/src/locales/` (`en.ts`, `fr.ts`).

## Principles

- Every UI string goes through **i18next** — no hard-coded copy in components.
- Avoid fragile string concatenation for sentences; use full phrases or interpolation.
- Dates, times, and number formatting follow the **active locale**.
- Layouts must tolerate **longer translations** (German-style expansion is a good stress test).

## Key conventions

- Keys grouped by **screen and intent** (e.g. `sections.today`, `empty.anytime`, `settingsExportDb`).
- Reuse shared keys for repeated concepts (`close`, `save`, section names).

## Adding a locale

1. Add `web/app/src/locales/<code>.ts` with the same key shape as `en.ts`.
2. Register it in [`web/app/src/i18n.ts`](../web/app/src/i18n.ts) (`resources` + storage key if user-selectable).
3. Expose the language in **Settings → General** if it should be user-selectable.
