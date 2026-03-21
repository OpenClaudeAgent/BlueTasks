# Qualité continue (BlueTasks)

## En local

| Commande | Rôle |
|----------|------|
| `npm run lint` | ESLint sur le **client** (TypeScript + React Hooks + **jsx-a11y**) puis sur le **serveur** (TypeScript, Node) |
| `npm run test` | Vitest — **web** (`src/lib` + **RTL** sur `SettingsDialog`) + **serveur** (sanitize, API HTTP, `dbSetup`, icônes) |
| `npm run test:coverage` | Idem avec **seuils** : `web/app` mesure `src/lib/**` uniquement ; `server` couvre `src/**` hors `index.ts` |
| `npm run duplicates` | [jscpd](https://github.com/kucherenko/jscpd) — clones copié-collés (seuil global dans `.jscpd.json`) |
| `npm run ci` | `lint` → `duplicates` → `test:coverage` → `build` |
| `npm run check` | Alias de `ci` |

## CI GitHub

Le workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) exécute la même chaîne sur Node 22 et publie les dossiers `coverage/` en artefacts.

## Stratégie de couverture front

- **`src/lib/**`** : logique métier (seuils principaux).
- **`SettingsDialog.tsx`** : premier composant couvert via **@testing-library/react** (fichier `src/test/setup.ts` + `@vitest-environment jsdom` sur les `*.test.tsx` concernés).
- Pour élargir : ajouter des tests RTL et étendre `coverage.include` dans [`web/app/vitest.config.ts`](../web/app/vitest.config.ts).

## Serveur

- Logique de validation extraite dans [`server/src/taskSanitize.ts`](../server/src/taskSanitize.ts) (tests unitaires).
- Application HTTP injectable via [`server/src/createApp.ts`](../server/src/createApp.ts) + DB mémoire pour les tests d’intégration (`supertest`).
