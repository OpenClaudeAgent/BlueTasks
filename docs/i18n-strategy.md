# i18n Strategy

## Langues de départ
- anglais
- français

## Principes
- toutes les chaînes UI sont externalisées
- aucune concaténation fragile pour les phrases visibles
- dates, heures et formats dépendent de la locale utilisateur
- les composants doivent accepter des textes plus longs

## Convention
- clés structurées par écran et intention
- exemple: `today.title`, `inbox.empty`, `task.new.placeholder`
