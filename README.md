# BlueTasks

Application de tâches **local-first** : panneau unique, cartes extensibles, notes riches (Lexical), date de suivi, **SQLite** sur disque, interface **FR / EN**.

---

## Installer et lancer (sans cloner le code)

### Avec l’image publiée (recommandé)

1. **Télécharger** l’image (remplace `v0.1.3` par le [tag](https://github.com/OpenClaudeAgent/BlueTasks/tags) voulu) :

   ```bash
   docker pull ghcr.io/openclaudeagent/bluetasks:v0.1.3
   ```

   Si le dépôt du package est privé : `docker login ghcr.io` avant le `pull`.

2. **Créer un dossier** pour la base (sur ta machine) :

   ```bash
   mkdir -p ./bluetasks-data
   ```

3. **Démarrer** le conteneur en liant le **port 8787** et le volume de données :

   ```bash
   docker run --rm -d \
     --name bluetasks \
     -p 8787:8787 \
     -v "$(pwd)/bluetasks-data:/app/.data" \
     ghcr.io/openclaudeagent/bluetasks:v0.1.3
   ```

4. Ouvrir **http://localhost:8787** dans le navigateur.

5. **Arrêter** :

   ```bash
   docker stop bluetasks
   ```

`docker pull` ne suffit pas : sans `docker run` (avec **`-p 8787:8787`**), rien n’écoute sur ton Mac.

---

## Depuis une copie du dépôt (Docker Compose)

Prérequis : [Node.js 22](https://nodejs.org/) et Docker.

```bash
git clone https://github.com/OpenClaudeAgent/BlueTasks.git
cd BlueTasks
npm run docker:release
docker compose up --build -d
```

Puis **http://localhost:8787**. Les données sont dans **`./.data`** à la racine du projet (monté dans le conteneur).

---

## Sans Docker (Node uniquement)

```bash
git clone https://github.com/OpenClaudeAgent/BlueTasks.git
cd BlueTasks
npm install
npm run build
npm run start
```

Puis **http://localhost:8787**. La base est créée sous **`.data/bluetasks.sqlite`** à la racine du repo.

---

## Sauvegarde des données

- **Interface** : Paramètres → Général → exporter / importer une base **`.sqlite`**.
- **Fichiers** : copier le dossier **`.data`** (ou `bluetasks-data` si tu as utilisé l’exemple `docker run` ci-dessus).

---

## Développement

```bash
npm install
npm run dev
```

- Front : **http://localhost:5173** (Vite).
- API : **http://localhost:8787** — le client appelle l’API sur ce port en dev ; il faut que le serveur tourne en parallèle (`npm run dev` à la racine lance les deux).

Optionnel : fichier `web/app/.env` avec `VITE_API_ORIGIN=https://ton-api` (sans slash final) si l’API n’est pas sur `localhost:8787`.

Qualité / CI / couverture : [docs/quality.md](docs/quality.md).  
Architecture, API, SQLite : [docs/architecture.md](docs/architecture.md).  
Accessibilité (lint) : [docs/a11y.md](docs/a11y.md).  
Docker détaillé (multi-arch, GHCR, tags `v*`) : [docs/docker.md](docs/docker.md).  
Index MCP RPG : [docs/rpg.md](docs/rpg.md).
