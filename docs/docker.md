# Docker et publication d’image

## Image locale

À la racine du dépôt :

```bash
docker compose build
docker compose up -d
```

L’app écoute sur **8787**. Les données SQLite sont dans le volume **`./.data`** sur l’hôte (`bluetasks.sqlite`).

Variables utiles : `HOST` (défaut `0.0.0.0`), `PORT` (défaut `8787`).

## Contenu de l’image

- **Plateformes** : le workflow **Docker image** construit **en parallèle** une image par arch sur des runners **natifs** (`ubuntu-latest` pour amd64, `ubuntu-24.04-arm` pour arm64 — réservé aux dépôts **publics** sur GitHub Free), puis publie un **manifest** multi-arch (`:tag` et `:latest`). Des tags intermédiaires `:tag-amd64` / `:tag-arm64` existent aussi sur le registre (utiles pour le debug). Le cache **GHA** (`type=gha`) accélère les rebuilds.
- **Build multi-étapes** : compilation Vite + `tsc` dans une étape `builder`, image finale avec `npm ci --omit=dev` limité au workspace **`@bluetasks/server`** et les artefacts `server/dist` + `web/app/dist` + `shared/`.
- Point d’entrée : `npm run start` (racine), comme en local.

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
