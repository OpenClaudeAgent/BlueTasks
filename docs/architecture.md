# Architecture BlueTasks

## Dépôts et exécution

- **`web/app`** — client React (Vite), UI, i18n, appels HTTP vers l’API.
- **`server`** — API Express, persistance **SQLite** (`better-sqlite3`), sert le build statique du client en production.
- **`shared/`** — artefacts partagés entre client et serveur sans dépendance npm croisée.

En développement, le front tourne sur le port Vite (ex. 5173) et appelle l’API sur **8787** (origine directe ou `VITE_API_ORIGIN`). En production, le serveur sert `web/app/dist` et expose API + fichiers statiques sur le même hôte.

## Contrat des icônes de zones

Le fichier **`shared/area-icon-ids.json`** est la liste canonique des identifiants d’icône pour les zones.

- Le **serveur** charge ce JSON au démarrage (`server/src/areaIconIds.ts`) et refuse les valeurs hors liste via `normalizeAreaIcon`.
- Le **client** importe le même JSON dans `web/app/src/lib/areaIcons.ts` et mappe chaque id à un composant Lucide. Un garde-fou au chargement du module vérifie que la map et le JSON sont alignés.

Toute nouvelle icône doit : mettre à jour le JSON, le mapping Lucide côté web, et éventuellement les textes UI (picker).

## Flux de données tâches

- Liste / création / mise à jour / suppression via REST sur le serveur.
- Le tableau principal est orchestré par le hook **`useBlueTasksBoard`** (`web/app/src/hooks/useBlueTasksBoard.ts`) : chargement, filtres par section et zone, autosave différé avec révisions pour éviter d’écraser des éditions plus récentes.

## Export et import de la base

- **`GET /api/export/database`** : `VACUUM INTO` vers un fichier temporaire, puis envoi du `.sqlite` (`Content-Disposition: attachment`). **Paramètres → Général** : « Exporter la base SQLite ».
- **`POST /api/import/database`** : corps **multipart**, champ fichier **`database`** (fichier `.sqlite` compatible BlueTasks). Remplace atomiquement le fichier SQLite de production après validation + migrations. **Paramètres → Général** : « Importer une base SQLite » (confirmation obligatoire). Inactif (`501`) si la base est `:memory:` (tests).

## Docker

- **Build JS** (Vite + `tsc`) sur le développeur ou **GitHub Actions** ; le contexte Docker (`.dockerctx/`) ne transporte que les `dist` + lockfiles. **`npm ci` prod serveur** s’exécute dans une étape Docker **Linux** (`deps`), puis image finale sans toolchain. Détails et GHCR : [`docs/docker.md`](docker.md).
- Données dans **`/app/.data`** (ex. `./.data` via `docker-compose`). Variables : `HOST=0.0.0.0`, `PORT=8787`.

## Structure serveur (tests)

- `server/src/index.ts` — point d’entrée : ouverture SQLite, `createApp`, écoute HTTP.
- `server/src/createApp.ts` — routes Express (réutilisée en tests avec une base `:memory:`).
- `server/src/dbSetup.ts` — schéma + migrations (`runMigrations`, `PRAGMA user_version`).
- `server/src/taskSanitize.ts` — normalisation des payloads tâches (tests unitaires).

## SQLite : version de schéma et restauration

- **`PRAGMA user_version`** : incrémentée par `runMigrations` dans [`server/src/dbSetup.ts`](server/src/dbSetup.ts). Une base plus récente que le code attendu provoque une erreur explicite au démarrage.
- **Sauvegarde** : `GET /api/export/database` ou copie de **`.data/bluetasks.sqlite`** (et des fichiers `-wal`/`-shm` si présents, après arrêt propre du serveur).
- **Restauration** : **Paramètres → Importer** (recommandé), ou arrêter le serveur et remplacer `bluetasks.sqlite` puis redémarrer. En Docker, volume **`./.data`** sur l’hôte.
