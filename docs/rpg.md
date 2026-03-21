# MCP RPG (Repository Planning Graph) — si ça « bloque »

## Configuration Cursor (`~/.cursor/mcp.json`)

Pour éviter **`npx`** (téléchargement / résolution lente, timeouts), tu peux pointer vers le binaire installé avec Node/NVM :

```json
"rpg": {
  "command": "/Users/sofiane/.nvm/versions/node/v22.14.0/bin/rpg-mcp-server",
  "args": []
}
```

Adapte le chemin si tu changes de version Node (`which rpg-mcp-server` après `npm i -g rpg-encoder` ou équivalent).

Redémarre Cursor ou recharge les serveurs MCP après modification.

## Test sans MCP (CLI)

Même moteur que le serveur MCP, depuis le dossier du projet :

```sh
rpg-encoder build -p .
rpg-encoder info -p .
```

(Utilise le `rpg-encoder` de ton PATH NVM, ex. `~/.nvm/versions/node/v22.14.0/bin/rpg-encoder`.)

## Ce qui s’est passé

Un appel **`build_rpg`** peut se terminer par **Error: Aborted** dans Cursor : en général ce n’est **pas** un graphe corrompu dans le repo, mais une **coupe côté client** (timeout, limite MCP, ou action arrêtée). Tant qu’il n’y a pas de dossier **`.rpg/`** à la racine, l’indexation n’a simplement pas abouti.

## Que faire

1. **Réessayer** `build_rpg` une fois (idéalement quand le projet n’est pas en plein `npm install`).
2. **Limiter le périmètre** si le repo grossit : le tool accepte `include` / `exclude` (globs), par ex. `include: "server/src/**"` puis élargir.
3. **`.rpgignore`** (à la racine, syntaxe type gitignore) : ce dépôt en contient un pour exclure `node_modules`, `dist`, `coverage` — moins de fichiers = build plus rapide et moins de risque d’abandon.
4. Si un **`.rpg/graph.json`** partiel pose problème : supprimer le dossier **`.rpg/`** et relancer `build_rpg`.
5. Après édition manuelle du graphe : **`reload_rpg`** pour recharger depuis le disque.

## Où c’est stocké

Une fois réussi, le graphe persiste sous **`.rpg/graph.json`** (ne pas commiter si vous préférez ; ajoutez `.rpg/` au `.gitignore` si besoin).
