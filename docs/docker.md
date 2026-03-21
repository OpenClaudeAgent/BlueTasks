# Docker et publication d’image

## Image locale

Le **build JS** (Vite + `tsc`) se fait **sur ta machine** (ou sur GitHub Actions), pas dans la couche finale de l’image. Le contexte Docker ne contient que ~1 Mo d’artefacts + `package-lock.json` ; **`npm ci --omit=dev`** pour le serveur s’exécute dans une étape intermédiaire **sous Linux**, pour que `better-sqlite3` corresponde à l’OS cible (évite l’erreur *Exec format error* si tu build sur Mac).

```bash
npm run docker:release    # npm ci + build + .dockerctx/
docker compose build
docker compose up -d
```

L’app écoute sur **8787**. Les données SQLite sont dans le volume **`./.data`** sur l’hôte (`bluetasks.sqlite`).

Variables utiles : `HOST` (défaut `0.0.0.0`), `PORT` (défaut `8787`).

## Contenu de l’image

- **CI / GitHub Actions** : `npm ci` → `npm run build` → `scripts/assemble-docker-context.sh` → `docker build` sur `.dockerctx/`. Pas de double build Vite dans Docker.
- **Dockerfile** : étape **`deps`** (Alpine + outils natifs uniquement pour compiler/télécharger `better-sqlite3`), étape **`runtime`** sans gcc/python — copie `node_modules` + `server/dist` + `web/app/dist` + `shared/`. Démarrage : `node server/dist/index.js`.
- **Plateformes** : workflow **Docker image** en **parallèle** (amd64 sur `ubuntu-latest`, arm64 sur `ubuntu-24.04-arm` pour les dépôts publics), puis manifest multi-arch `:tag` et `:latest`. Tags intermédiaires `:tag-amd64` / `:tag-arm64`. Cache Buildx **GHA** sur le contexte.

## Import / export SQLite

- **Export** : Paramètres → Général, ou `GET /api/export/database`.
- **Import** : Paramètres → Général (fichier `.sqlite`), ou `POST /api/import/database` (multipart, champ **`database`**). Remplace entièrement la base sur disque ; **non disponible** si le serveur tourne avec une base `:memory:` (tests).

## Publier sur GitHub Container Registry

1. Pousser un tag de version, par ex. `git tag v0.2.0 && git push origin v0.2.0`.
2. Le workflow [`.github/workflows/docker-publish.yml`](../.github/workflows/docker-publish.yml) construit et pousse l’image (déclenché **uniquement** par les tags `v*`) :

   `ghcr.io/<propriétaire>/bluetasks:<tag>`

   (le nom d’image est mis en minuscules automatiquement.)

3. Tirer et lancer :

   ```bash
   docker pull ghcr.io/votre-org/bluetasks:v0.2.0
   docker run -p 8787:8787 -v bluetasks-data:/app/.data ghcr.io/votre-org/bluetasks:v0.2.0
   ```

Pour un volume nommé Docker : `-v bluetasks-data:/app/.data` persiste la base dans le volume `bluetasks-data`.

## `docker-compose` avec une image publiée

Vous pouvez remplacer la section `build` par une image :

```yaml
services:
  bluetasks:
    image: ghcr.io/votre-org/bluetasks:v0.2.0
    ports:
      - "8787:8787"
    volumes:
      - ./.data:/app/.data
```

Gardez le même montage **`.data`** pour conserver les données entre mises à jour d’image.
