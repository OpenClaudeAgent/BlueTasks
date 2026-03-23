# Mobile HTTP API coverage and notes

This document maps the **Express server** routes to **web** and **Kotlin Multiplatform** clients, and records how **Lexical** (`contentJson`) and **plain text** (`contentText`) interact on mobile.

## HTTP endpoint matrix

The server mounts only these JSON/multipart APIs (see `server/src/createApp.ts`):

| Method | Path                   | Purpose                                 |
| ------ | ---------------------- | --------------------------------------- |
| GET    | `/api/tasks`           | List all tasks                          |
| POST   | `/api/tasks`           | Create task                             |
| PUT    | `/api/tasks/:id`       | Update task                             |
| DELETE | `/api/tasks/:id`       | Delete task                             |
| GET    | `/api/categories`      | List categories                         |
| POST   | `/api/categories`      | Create category                         |
| PUT    | `/api/categories/:id`  | Update category                         |
| DELETE | `/api/categories/:id`  | Delete category                         |
| GET    | `/api/export/database` | Download SQLite snapshot                |
| POST   | `/api/import/database` | Replace DB (multipart field `database`) |

**Web client:** `web/app/src/api.ts` (`tasksApi`, `categoriesApi`, `downloadDatabaseExport`, `uploadDatabaseImport`).

**Mobile client:** `shared/.../BlueTasksApi.kt` — same operations; `BlueTasksAppViewModel` wires connect, refresh, task saves, settings (categories), export/import.

There are **no additional public REST routes** on the server today; if the product feels “incomplete” on mobile, the gap is usually **UI/domain** (below), not a missing HTTP method.

## Functional gaps vs web (not separate APIs)

| Area           | API fields                             | Mobile today                                                                                                                                                                                   |
| -------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Checklist**  | `checklistTotal`, `checklistCompleted` | Passed through `toWritePayload` / `TaskWritePayload`; no mobile UI to edit checklist items (web uses Lexical).                                                                                 |
| **Rich notes** | `contentJson` (Lexical), `contentText` | Phase A: mobile edits **plain text** only; `contentJson` is preserved on save when the editor does not replace it. See below and [mobile-rich-notes-phase-b.md](mobile-rich-notes-phase-b.md). |

## Lexical (`contentJson`) vs plain text (`contentText`)

- The server persists **both** fields (`server/src/routes/tasksRoutes.ts`, `taskSanitize.ts`).
- **Web** edits rich bodies in Lexical and keeps `contentText` aligned from the editor pipeline (`TaskCardExpandedBody.tsx` and related).
- **Mobile (Phase A):** `TaskEditorSheet` updates `contentText`; `buildTask()` keeps the existing `task.contentJson` for typical note saves so the web does not lose rich JSON from a mobile text-only edit **as long as** the client sends the prior JSON unchanged (see `TaskEditorSheet` / `toWritePayload` in `shared/.../domain/TaskBoard.kt`).
- **Conflict policy:** If a task is heavily edited on **web** (Lexical) and on **mobile** (plain text), the **last write wins** at the HTTP layer. The web stack also uses merge helpers in `web/app/src/lib/tasks.ts` (`mergeTaskFromApi`, etc.) when reconciling local state; mobile does not re-implement that merge — it treats the server response after each save as source of truth on the next refresh.

**Product direction:** For richer mobile behavior without a full Lexical port, see options in [mobile-rich-notes-phase-b.md](mobile-rich-notes-phase-b.md). For feature-level parity tracking, see [mobile-web-parity-backlog.md](mobile-web-parity-backlog.md).

## Dependency and toolchain upgrades (tracked work)

Upgrades are **not** tied to new HTTP routes; they reduce warnings and keep KMP/AndroidX in a supported matrix.

### Gradle / Android (KMP)

Pinned today in `mobile/gradle/libs.versions.toml` and `mobile/composeApp/build.gradle` (e.g. **AGP 8.5.x**, **compileSdk 34**, **Kotlin 2.0.21**) — see comments there and in `mobile/README.md`.

**When bumping versions, do these together in one change set:**

1. Choose a **Kotlin** release that supports the target **AGP** (see JetBrains + Android release notes).
2. Bump **AGP** and **Gradle** if required by that AGP.
3. Raise **compileSdk** / **targetSdk** (often **35**) and align **AndroidX** (e.g. `androidx-core` — note the repo comment that **1.15.x** wants compileSdk 35).
4. Re-run `./gradlew :composeApp:compileDebugKotlinAndroid`, `:composeApp:compileKotlinIosSimulatorArm64`, and `./gradlew qualityGate`.

Optional: add a version-catalog or Gradle **dependency update** report in CI when you want periodic audits.

### npm (web + server workspaces)

From repo root: `npm outdated`, `npm audit` (see `package.json` scripts). Apply minor/patch upgrades with `npm run test` and `npm run build` for affected workspaces.

### Compose deprecation warnings

Material icons that are **directional** should use **AutoMirrored** variants (e.g. `Icons.AutoMirrored.Outlined.*` with `import androidx.compose.material.icons.automirrored.outlined.*` as needed) to avoid `Icons.Outlined.*` deprecations.
