# Internationalization (i18n)

## Supported locales

- English (`en.ts`)
- French (`fr.ts`)
- German (`de.ts`)
- Spanish (`es.ts`)
- Italian (`it.ts`)
- Dutch (`nl.ts`)
- Polish (`pl.ts`)
- Portuguese (`pt.ts`)
- Japanese (`ja.ts`)

All user-visible strings live in `web/app/src/locales/`. The list of selectable languages (labels + codes) is centralized in [`web/app/src/locales/uiLanguages.ts`](../web/app/src/locales/uiLanguages.ts).

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
2. Register it in [`web/app/src/i18n.ts`](../web/app/src/i18n.ts) (`resources`).
3. Add an entry to **`UI_LANGUAGE_OPTIONS`** in [`uiLanguages.ts`](../web/app/src/locales/uiLanguages.ts) (native label for the switcher).
4. Map the code in [`dayPickerLocale.ts`](../web/app/src/lib/dayPickerLocale.ts) to a **date-fns** locale for the task date calendar.
5. **Settings → General** lists every entry in `UI_LANGUAGE_OPTIONS` automatically.
