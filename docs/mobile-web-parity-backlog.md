# Mobile vs web parity backlog

Ordered backlog for the Kotlin Multiplatform client. Each row lists the **web reference**, whether the **REST API** already supports it, and the **mobile owner** layer.

| Priority | Feature | Web reference | API | Mobile owner |
|----------|---------|---------------|-----|--------------|
| P0 | Board sections + category filter | `Sidebar.tsx`, `useBlueTasksBoard.ts`, `lib/tasks.ts` | Yes | `shared` domain + `UI` |
| P0 | Task list + quick capture | `App.tsx`, `useBlueTasksTasksAndSaves.ts` | Yes | `ViewModel` + `UI` |
| P0 | Task detail: title, notes Phase A, save debounce | `TaskCard.tsx`, expanded body | Yes | `ViewModel` + `UI` |
| P1 | Due date (YYYY-MM-DD) + quick set today/tomorrow | `TaskCardHeaderDatePopover.tsx`, `parseDateKey.ts` | Yes | `shared` (keys) + `UI` |
| P1 | Live running timer on board + sheet | `useBoardTimerNowMs.ts`, `taskTimerEdit.ts` | Yes | `shared` (duration math) + `UI` |
| P1 | Priority / estimate / pin / recurrence / category | `TaskCardFooter*.tsx` | Yes | `UI` (labels) + existing VM |
| P2 | Settings: language | `SettingsDialog.tsx`, `LanguageSwitcher.tsx` | N/A (client-only) | **Deferred** — mobile strings only for now |
| P2 | Settings: export/import SQLite | `SettingsDialog.tsx`, `api.ts` | Yes | `ViewModel` + `FileBridge` |
| P2 | Categories CRUD + inline edit + delete confirm | `SettingsDialog.tsx` | Yes | `ViewModel` + `UI` |
| P3 | Resizable sidebar | `useResizableSidebarWidth.ts` | N/A | **Mobile**: bottom nav — acceptable difference |
| P3 | Rich Lexical editor | `LexicalTaskEditor.tsx` | Yes (`contentJson`) | **Epic** — see [mobile-rich-notes-phase-b.md](mobile-rich-notes-phase-b.md) |
| P3 | Full i18n parity | `locales/*.ts` | N/A | `UI` Compose Resources + key alignment |

**Done in this iteration**: modular screens, timer tick + duration formatting, date key validation + quick chips, category icon picker UI, rename category (`PUT /api/categories/:id`), delete confirmation with task count, string resources for sections and common labels, Phase B doc.

**See also:** [mobile-http-api-matrix.md](mobile-http-api-matrix.md) (REST route matrix, Lexical vs `contentText`, dependency upgrade checklist).
