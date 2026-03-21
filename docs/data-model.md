# Data Model

## Entités

### Task
- `id`
- `title`
- `notes`
- `status`
- `dueDate`
- `scheduledStart`
- `scheduledEnd`
- `createdAt`
- `updatedAt`

### Project
Regroupement simple.

### Tag
Classification légère.

### RecurrenceRule
Base pour la récurrence future.

### CalendarBlock
Projection d’une tâche sur le calendrier.

## Règles
- une tâche peut exister sans date
- une échéance n’est pas une planification
- `Today` montre les tâches dues ou planifiées aujourd’hui
