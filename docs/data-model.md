# Data model

This document matches the current SQLite schema and API task shape. See [`server/src/dbSetup.ts`](../server/src/dbSetup.ts) and [`server/src/taskSanitize.ts`](../server/src/taskSanitize.ts).

## `tasks` table (API: task row)

| Field                | Type                                                                 | Notes                                                     |
| -------------------- | -------------------------------------------------------------------- | --------------------------------------------------------- |
| `id`                 | string (UUID)                                                        | Primary key                                               |
| `title`              | string                                                               | Required                                                  |
| `status`             | `'pending' \| 'completed'`                                           |                                                           |
| `taskDate`           | `YYYY-MM-DD` or null                                                 | Single follow-up / due date key used for Today / Upcoming |
| `contentJson`        | string                                                               | Lexical editor document (JSON string)                     |
| `contentText`        | string                                                               | Plain-text mirror for search / preview                    |
| `checklistTotal`     | integer                                                              | ≥ 0                                                       |
| `checklistCompleted` | integer                                                              | 0 … `checklistTotal`                                      |
| `priority`           | `'low' \| 'normal' \| 'high'`                                        | Default `normal`                                          |
| `estimateMinutes`    | integer or null                                                      | Positive, capped at 24h                                   |
| `pinned`             | boolean                                                              | Stored as INTEGER 0/1                                     |
| `timeSpentSeconds`   | integer                                                              | ≥ 0                                                       |
| `timerStartedAt`     | ISO string or null                                                   | Active timer anchor                                       |
| `recurrence`         | `'daily' \| 'weekly' \| 'biweekly' \| 'monthly' \| 'yearly'` or null |                                                           |
| `areaId`             | string or null                                                       | FK to `areas.id` if present                               |
| `createdAt`          | ISO string                                                           | Set by server                                             |
| `updatedAt`          | ISO string                                                           | Set by server                                             |

### Rules (product)

- **`taskDate` null** — pending tasks show in **Anytime** only (not Today/Upcoming).
- **`taskDate` ≤ today** — pending tasks show in **Today** (overdue dates included).
- **`taskDate` > today** — pending tasks show in **Upcoming**.
- **Completed** tasks appear only in **Done** (section filter in [`filterTasks`](../web/app/src/lib/tasks.ts)).
- There is a **single** date column per task — no separate “due” vs “scheduled” fields in SQLite.

## `areas` table

| Field        | Type    | Notes                                               |
| ------------ | ------- | --------------------------------------------------- |
| `id`         | string  | Primary key                                         |
| `name`       | string  | Required                                            |
| `sort_index` | integer | Sidebar order                                       |
| `icon`       | string  | Must be an id from `server/data/area-icon-ids.json` |
| `created_at` | string  | ISO                                                 |

Areas group tasks for filtering in the sidebar (**All areas**, **Unassigned**, or a specific area).

## Schema version

- **`PRAGMA user_version`** — must equal `CURRENT_SCHEMA_VERSION` in `dbSetup.ts` after migrations.
- Legacy columns are added via idempotent `ALTER` helpers in `migrateTasksTable` / `migrateAreasTable` when opening older files.
