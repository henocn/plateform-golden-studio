## Vue d’ensemble des emails de notification

- **Canal**: uniquement email (les notifications en temps réel ont été supprimées)
- **Branding**: Qidoo (nom configurable via `EMAIL_BRAND_NAME`)
- **Lien base**: `FRONTEND_URL` (ou `APP_URL` en fallback)

### 1. Tâches d’événement assignées

- **Type technique**: `event_task_assigned`
- **Déclencheur**: création d’un événement avec des tâches (issues d’un template)
- **Fichier / fonction**:
  - `calendar.service.js` → `create()`
- **Bénéficiaires**:
  - Tous les utilisateurs référencés dans `tasks[].responsible_user_id` de l’événement
- **Template**:
  - Sujet: `Tâches d’événement assignées — [Nom de l’événement]`
  - Corps: liste des tâches avec leurs dates cibles, lien vers l’onglet événements du calendrier

### 2. Rappel de deadline de tâche

- **Type technique**: `task_deadline_warning`
- **Déclencheur**: cron de rappel de tâches lorsque la `due_date` approche
- **Fichier / fonction**:
  - `cron.js` → job de rappel tâches → `notificationService.onTaskDeadlineWarning(...)`
  - `notification.service.js` → `onTaskDeadlineWarning()`
- **Bénéficiaires**:
  - Utilisateur assigné à la tâche (`task.assigned_to`)
- **Template**:
  - Sujet: `Rappel de deadline — [Titre de la tâche]` (ou `Dernier rappel de deadline — ...`)
  - Corps: rappelle le titre, la date limite et le nombre de jours restants, lien vers `/tasks/[id]`

### 3. Rappel de publication éditoriale

- **Type technique**: `publication_deadline_warning`
- **Déclencheur**: cron de rappel des publications éditoriales lorsque la date de publication approche
- **Fichier / fonction**:
  - `cron.js` → job de rappel publications → `notificationService.onPublicationDeadlineWarning(...)`
  - `notification.service.js` → `onPublicationDeadlineWarning()`
- **Bénéficiaires**:
  - Créateur de la publication (`publication.created_by`)
- **Template**:
  - Sujet: `Rappel de publication — [Titre de la publication]`
  - Corps: rappelle la date de publication et les jours restants, lien vers `/calendar/editorial`

### 4. Proposition de tâche à valider

- **Type technique**: `task_pending_validation`
- **Déclencheur**: création d’une nouvelle proposition (`Proposal`) pour un projet ou une tâche
- **Fichier / fonction**:
  - `proposal.service.js` → `_notifyNewProposal()`
- **Bénéficiaires**:
  - Tous les utilisateurs ayant le droit `proposals.validate`
  - Optionnellement, le créateur de la tâche liée (si `task_id` présent)
- **Template**:
  - Sujet: `Validation de proposition de tâche — [Titre de la tâche ou du projet]`
  - Corps: rappelle le numéro de version, l’auteur et la date de soumission, lien vers la tâche ou le projet

### 5. Résultat de validation de proposition

- **Type technique**: `task_pending_validation`
- **Déclencheur**: validation d’une proposition (statut `approved`, `needs_revision`, `rejected`)
- **Fichier / fonction**:
  - `proposal.service.js` → `_notifyValidationResult()`
- **Bénéficiaires**:
  - Chargé de la tâche (`task.assigned_to`) si différent du validateur
  - Auteur de la proposition (`proposal.author_id`) si différent du validateur et du chargé de tâche
- **Template**:
  - Sujet: `Statut de votre proposition — [Titre de la tâche]`
  - Corps: mentionne le statut humain (`approuvée`, `en demande de révision`, `refusée`), le commentaire du validateur et la date de validation, lien vers la tâche

