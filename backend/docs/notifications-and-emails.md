# Notifications et envoi d’emails

Ce document décrit **où** et **quand** sont envoyées les notifications (cloche in-app + temps réel) et les emails, ainsi que le fonctionnement du cron des deadlines.

---

## 1. Tableau récapitulatif

| # | Déclencheur | Fichier | Moment | Destinataires | Notification in-app | Email |
|---|-------------|---------|--------|----------------|--------------------|-------|
| 1 | **Création d’une proposition** | `proposals/proposal.service.js` | Juste après `create()` (soumission) | Utilisateurs avec droit `proposals.validate` + créateur de la tâche (hors auteur de la proposition) | Oui (`notifyMany`) | Oui (template stylé) |
| 2 | **Décision sur une proposition** (approuvée / révision / rejet) | `proposals/proposal.service.js` | Juste après `validate()` | Chargé de la tâche + auteur de la proposition (si différents du validateur) | Oui (`notifyMany`) | Oui (template stylé) |
| 3 | **Création d’un événement calendrier** | `calendar/calendar.service.js` | Juste après `create()` | Rôles : `super_admin`, `admin`, `client_admin` | Oui (`notifyMany`) | Oui (template stylé) |
| 4 | **Tâche passée en « Terminé »** (à valider) | `tasks/task.service.js` → `notifications/notification.service.js` | Lors du `updateStatus(id, 'done')` (PATCH statut tâche) | Utilisateurs avec droit `proposals.validate` | Oui (`notifyMany`) | Oui (template stylé) |
| 5 | **Avertissement deadline tâche** (approche date limite) | `notifications/notification.service.js` | **Cron** tous les jours à 08:00 (voir §2) | Assigné de la tâche | Oui (`notify`) | Oui (template stylé) |
| 6 | **Avertissement deadline publication** (approche date de publication) | `notifications/notification.service.js` | **Cron** tous les jours à 08:00 (voir §2) | Créateur de la publication | Oui (`notify`) | Oui (template stylé) |
| 7 | **Rappel tâche (date limite = demain)** | `tasks/task.service.js` | **Script manuel ou planificateur externe** `reminder.job.js` | Assigné + créateur de la tâche (superviseur) | Non | Oui (template stylé) |

- **Notification in-app** : enregistrement en base + push temps réel (Socket.IO) vers le client.
- **Email** : envoi via le transport configuré (`config/email.js`, `utils/sendEmail.js`), avec template HTML (`utils/emailTemplates.js`). Si l’email n’est pas configuré (`.env`), l’envoi est ignoré sans erreur.

---

## 2. Cron des deadlines (notifications + emails)

### 2.1 Fonctionnement

Le cron est **démarré automatiquement** au lancement du serveur dans `server.js` :

```js
const { startCronJobs } = require('./src/config/cron');
// …
startCronJobs();
```

Fichier de configuration : **`src/config/cron.js`**.

- **Planification** : tous les jours à **08:00** (horaire du serveur).
- **Expression** : `0 8 * * *` (minute 0, heure 8, tous les jours).

À 08:00, le cron exécute dans l’ordre :

1. **`checkPublicationDeadlines()`**  
   - Publications dont le statut n’est ni `published` ni `archived`, avec une `publication_date` renseignée.  
   - Pour chaque publication dont la date est dans **J‑3** ou **J‑1** par rapport à aujourd’hui :  
     - Appel à `notificationService.onPublicationDeadlineWarning(pub, diffDays, isLastWarning)`.  
   - Envoi d’une **notification in-app** + **email** au **créateur** de la publication (un seul envoi par jour et par publication, dédoublonné).

2. **`checkTaskDeadlines()`**  
   - Tâches dont le statut n’est ni `done` ni `cancelled`, avec `due_date` et `assigned_to` renseignés.  
   - Pour chaque tâche dont la date limite est dans **J‑3** ou **J‑1** :  
     - Appel à `notificationService.onTaskDeadlineWarning(task, diffDays, isLastWarning)`.  
   - Envoi d’une **notification in-app** + **email** à l’**assigné** de la tâche (un seul envoi par jour et par tâche, dédoublonné).

Les seuils **J‑3** et **J‑1** sont configurables dans le `.env` :

| Variable | Défaut | Rôle |
|----------|--------|------|
| `NOTIF_PUBLICATION_FIRST_WARNING_DAYS` | 3 | Jours avant publication pour le **premier** avertissement (J‑3). |
| `NOTIF_PUBLICATION_LAST_WARNING_DAYS`  | 1 | Jours avant publication pour le **dernier** avertissement (J‑1). |
| `NOTIF_TASK_FIRST_WARNING_DAYS`        | 3 | Jours avant date limite tâche pour le **premier** avertissement (J‑3). |
| `NOTIF_TASK_LAST_WARNING_DAYS`        | 1 | Jours avant date limite tâche pour le **dernier** avertissement (J‑1). |

### 2.2 Utilisation

- **En développement / production** : lancer le serveur comme d’habitude (`npm run dev` ou `npm start`). Le cron est actif ; à 08:00 chaque jour, les vérifications de deadlines s’exécutent et envoient notifications + emails selon la config.
- **Changer l’horaire** : modifier l’expression dans `src/config/cron.js` (ex. `0 9 * * *` pour 09:00).
- **Logs** : les exécutions et erreurs sont loguées (`[CRON] Vérification des deadlines…` / `[CRON] Erreur…`).

---

## 3. Script de rappel « date limite demain » (emails seuls)

Le fichier **`src/modules/tasks/reminder.job.js`** envoie des **emails uniquement** (pas de notification in-app) pour les tâches dont la **date limite est demain**. Destinataires : assigné + créateur de la tâche.

- Ce script **n’est pas** exécuté par le cron intégré au serveur.
- Pour l’utiliser :
  - **Manuel** : depuis la racine du backend  
    `node src/modules/tasks/reminder.job.js`
  - **Planificateur système** (cron OS, Task Scheduler, etc.) : planifier l’exécution de cette commande une fois par jour (ex. à 08:00 ou 09:00).

À la différence du cron §2, ce job cible uniquement les tâches dont la date limite est **demain** et n’utilise pas les seuils J‑3 / J‑1.

---

## 4. Fichiers concernés

| Rôle | Fichier |
|------|---------|
| Planification cron (deadlines) | `src/config/cron.js` |
| Démarrage cron au boot | `server.js` |
| Envoi email (transport + no-op si non configuré) | `src/utils/sendEmail.js` |
| Templates HTML + texte des emails | `src/utils/emailTemplates.js` |
| Configuration transport email | `src/config/email.js` |
| Variables env (délais, email, FRONTEND_URL) | `src/config/env.js`, `.env` |
| Notifications (création, dédoublonage, envoi email) | `src/modules/notifications/notification.service.js` |
| Rappel « demain » (emails seuls) | `src/modules/tasks/reminder.job.js`, `task.service.js` (sendDeadlineReminders) |

---

## 5. Notification « Tâche à valider » (ligne 4)

Lorsqu’une tâche passe au statut **« Terminé »** (`PATCH /tasks/:id` avec `status: 'done'`), le service `task.service.js` appelle `notificationService.onTaskPendingValidation(task)`. Les utilisateurs ayant le droit `proposals.validate` reçoivent une notification in-app et un email les invitant à valider les propositions liées à cette tâche.
