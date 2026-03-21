# Plan d’amélioration d’architecture (analyse cycles / graphe sémantique)

Document de travail : objectifs par phase, livrables et critères de succès. À mettre à jour après chaque incrément.

## État au dépôt (snapshot)

| Élément | Statut |
|--------|--------|
| Commentaires FR → EN (`createApp.ts`, `editorState.ts`) | Fait (commits précédents) |
| Gate couverture serveur + tests `expectApiTaskRow` | Fait |
| Découpe `useBlueTasksBoard` → `useBlueTasksUiState` + `useBlueTasksTasksAndSaves` (`hooks/blueTasks/`) | Fait |
| Reste du plan (formatting/, ESLint DAG, etc.) | Non démarré |

## Ajustements de réalité (à lire avant d’exécuter)

1. **Les hooks ne suppriment pas les cycles de modules à eux seuls.** Tant que `tasks.ts` importe `editorState` et que `TaskCard` importe `tasks`, le graphe d’imports TypeScript reste cyclique. Il faut **déplacer du code** (types purs, fonctions sans dépendance inverse) ou **inverser une dépendance** (injection, façade). `useTaskOperations` utile pour la lisibilité et les tests, mais ce n’est pas un remède magique aux cycles.

2. **`filterTasks` / `sortTasks` dans `tasks.ts`.** Ce ne sont pas des dépendances mutuelles problématiques : ce sont des fonctions du même module. Les outils de cycles comptent souvent des **chemins longs** qui repassent par le même fichier ; la priorité est de couper les arêtes **UI → domaine** et **domaine → UI**, pas de « séparer » deux exports du même fichier.

3. **`eslint-plugin-depend` / DAG strict.** Puissant mais coûteux à faire respecter d’un coup. Mieux : **règles incrémentales** (interdire `components/` → hors `lib/` pour certains sous-chemins) ou une première passe manuelle + revue.

4. **Métriques « 48 → &lt;20 cycles ».** À recalculer avec le **même outil et les mêmes entrées** après chaque phase ; sinon les chiffres ne sont pas comparables.

---

## Phase 1 — Problèmes critiques (semaine 1)

### 1.1 Commentaires en français

- **Impact** : faible complexité, forte visibilité.
- **Action** : traduire JSDoc / blocs techniques restants en anglais.
- **Effort** : ~15 min (déjà traité sur les deux fichiers identifiés ; revue globale optionnelle).

### 1.2 Analyse des cycles cross-fichiers (cause racine)

- **Constat** : nombre élevé de cycles, concentration UI / tâches / utilitaires.
- **Actions** : cartographier les 10 cycles les plus fréquents ; isoler formatters purs vs logique métier.
- **Effort** : ~2 h.
- **Livrable** : graphe ou liste exportée (outil utilisé + commande).

---

## Phase 2 — Découplage des dépendances (semaines 2–3)

### 2.1 Couche utilitaire « pure »

- Regrouper formatage / dates / icônes dans une arborescence claire (`lib/formatting/`, etc.) **sans** y importer de composants React.
- **Condition de succès** : aucun fichier sous `components/` importé depuis ces modules.

### 2.2 Séparer rendu UI et logique métier

- Extraire des hooks ou services testables ; faire consommer les composants via ces API.
- **Rappel** : déplacer les imports ne suffit pas — il faut que les modules feuilles n’importent pas les couches hautes.

### 2.3 Découper l’état (`useBlueTasksBoard`)

- Scinder en hooks plus petits (`useTasksState`, `useAreasState`, `useUIState`) avec un composeur fin pour limiter les régressions.
- **Bénéfice** : testabilité et lecture ; cycles réduits seulement si les dépendances entre modules changent.

---

## Phase 3 — Restructuration (semaine 4)

- Hiérarchie cible : Utilities → DataModels → Domain → State → UI → (client API / persistance côté serveur déjà séparé).
- **Règles d’import** : DAG strict (pas d’import « vers le haut »).
- **Enforcement** : ESLint ciblé ou plugin de dépendances, adopté progressivement.

---

## Phase 4 — Validation (semaines 4–5)

- Re-lancer la détection de cycles ; viser une baisse nette et des cycles courts « acceptables » (barils, réexports).
- Maintenir la **suite de tests + gate de couverture** verte à chaque PR.
- Optionnel : taille de bundle / temps de compilation avant-après.

---

## Quick wins (ordre suggéré)

1. ~~Traductions commentaires~~ (fait sur les fichiers listés).
2. Clarifier dossiers `lib/` (formatting vs domain) **sans** tout renommer d’un coup — une PR à la fois.
3. Découper `useBlueTasksBoard` par blocs cohérents (le plus gros gain lisibilité).
4. Mesure de cycles après 2–3 PR (même outil qu’au départ).

---

## Risques (rappel)

- Régressions d’API composants → migration progressive, wrappers temporaires.
- Régressions perf → comparer bundle / profils sur un chemin critique.
- Cas limites hooks → tests d’intégration existants + nouveaux tests ciblés.

---

## Métriques (à remplir après mesure)

| Métrique | Actuel (à noter) | Cible indicatif | Échéance |
|----------|------------------|-----------------|----------|
| Cycles cross-fichiers | 48 (outil ?) | &lt; 20 | S3 |
| Longueur max de cycle | 10+ | 2–3 idéalement | S3 |
| Indépendance couche utilitaires | Non | Oui | S2 |
| Couverture domaine (si scope défini) | — | ↑ | S4 |
| Taille bundle | baseline | stable ou ↓ | S5 |
