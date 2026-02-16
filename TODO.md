# TODO — GovCom Platform

> **Plateforme B2B Multi-tenant** — Golden Studio × Institutions Clientes
> Ordre de réalisation : **Backend → Backoffice (Frontend interne) → Client Portal (Frontend client)**
> Référence : `proposition.md` (architecture) + `CDC.md` (cahier des charges)

---

## PHASE 1 — BACKEND (`/backend`)

### 1.1 — Setup & Infrastructure

- [x] **1.1.1** Initialiser le projet Node.js (`npm init`, `.gitignore`, `.editorconfig`)
- [x] **1.1.2** Installer toutes les dépendances :
  - Express, Sequelize, pg, pg-hstore
  - jsonwebtoken, bcrypt, speakeasy, qrcode
  - joi, multer, winston, helmet, cors, express-rate-limit
  - dotenv, envalid
  - swagger-jsdoc, swagger-ui-express
  - pdfkit, exceljs
  - uuid
  - Dev : jest, supertest, nodemon, sequelize-cli
- [x] **1.1.3** Créer la structure de dossiers complète (`src/config`, `src/modules`, `src/models`, `src/middlewares`, `src/utils`, `database/migrations`, `database/seeders`, `uploads`, `tests`)
- [x] **1.1.4** Configurer les variables d'environnement : `.env.example`, `src/config/env.js` (validation avec envalid)
- [x] **1.1.5** Configurer Sequelize : `.sequelizerc`, `src/config/database.js` (connection pool, dialectOptions)
- [x] **1.1.6** Configurer Winston : `src/utils/logger.js` (console + file transports, pas de données sensibles)
- [x] **1.1.7** Créer les utilitaires de base :
  - `src/utils/ApiResponse.js` (format standardisé succès)
  - `src/utils/ApiError.js` (codes erreur métier personnalisés)
  - `src/utils/pagination.js` (helper pagination default 20, max 100)
- [x] **1.1.8** Configurer Express (`src/app.js`) : helmet, cors, rate-limit, json parser, routes prefix `/api/v1`
- [x] **1.1.9** Créer `server.js` (point d'entrée, connexion DB, écoute port)
- [x] **1.1.10** Configurer les scripts npm : `dev`, `start`, `db:migrate`, `db:seed:all`, `db:migrate:undo`, `test`
- [x] **1.1.11** Vérifier que `npm run dev` démarre sans erreur (serveur + connexion DB)

### 1.2 — Modèles & Migrations

- [x] **1.2.1** Modèle + Migration `Organization` (UUID PK, name, short_name, type ENUM, logo_path, contact_email, contact_phone, address, is_active, created_by FK, timestamps)
- [x] **1.2.2** Modèle + Migration `User` (UUID PK, email unique, password_hash, first/last_name, user_type ENUM, role ENUM, organization_id FK nullable, job_title, avatar_path, is_active, 2FA fields, last_login_at, created_by FK, timestamps + contraintes métier)
- [x] **1.2.3** Modèle + Migration `RefreshToken` (UUID PK, user_id FK, token_hash unique, expires_at, revoked, created_at)
- [x] **1.2.4** Modèle + Migration `Project` (UUID PK, organization_id FK, title, description, agency_direction, internal_manager_id FK, studio_manager_id FK, client_contact_id FK, priority ENUM, status ENUM, target_date, created_by FK, timestamps)
- [x] **1.2.5** Modèle + Migration `Brief` (UUID PK, project_id FK, organization_id FK, description, objective, target_audience, key_message, deadline, submitted_by FK, timestamps)
- [x] **1.2.6** Modèle + Migration `BriefAttachment` (UUID PK, brief_id FK, organization_id FK, file_name, file_path, file_size, mime_type, uploaded_by FK, created_at)
- [x] **1.2.7** Modèle + Migration `Task` (UUID PK, project_id FK, organization_id FK, title, description, assigned_to FK nullable, due_date, status ENUM, priority ENUM, visibility ENUM, created_by FK, timestamps)
- [x] **1.2.8** Modèle + Migration `TaskComment` (UUID PK, task_id FK, organization_id FK, user_id FK, content, is_internal, timestamps)
- [x] **1.2.9** Modèle + Migration `Proposal` (UUID PK, project_id FK, organization_id FK, version_number, title, description, file_path, author_id FK, validator_id FK nullable, status ENUM, submitted_at, timestamps)
- [x] **1.2.10** Modèle + Migration `ProposalComment` (UUID PK, proposal_id FK, organization_id FK, user_id FK, content, is_internal, created_at)
- [x] **1.2.11** Modèle + Migration `Validation` (UUID PK, proposal_id FK, organization_id FK, validator_id FK, status ENUM, comments, validated_at, created_at)
- [x] **1.2.12** Modèle + Migration `Publication` (UUID PK, project_id FK, organization_id FK, proposal_id FK nullable, publication_date, channel ENUM, link, archive_path, created_by FK, timestamps)
- [x] **1.2.13** Modèle + Migration `CalendarEvent` (UUID PK, organization_id FK, project_id FK nullable, title, type ENUM, start_date, end_date, status ENUM, description, visibility ENUM, created_by FK, timestamps)
- [x] **1.2.14** Modèle + Migration `Media` (UUID PK, organization_id FK nullable, name, type ENUM, tags JSONB, file_path, file_name, file_size, mime_type, is_global, uploaded_by FK, timestamps)
- [x] **1.2.15** Modèle + Migration `AuditLog` (UUID PK, user_id FK nullable, organization_id FK nullable, action, entity_type, entity_id, old_value JSONB, new_value JSONB, ip_address, user_agent, created_at — **no updated_at**)
- [x] **1.2.16** Fichier `src/models/index.js` : charger Sequelize, importer tous les modèles, définir toutes les associations (belongsTo, hasMany, etc.)
- [x] **1.2.17** Exécuter `db:migrate` et vérifier que toutes les tables sont créées avec les contraintes correctes

### 1.3 — Module Auth

- [x] **1.3.1** `auth.middleware.js` — Vérifier JWT, décoder payload, attacher `req.user` (id, email, user_type, role, organization_id), gérer token expiré/invalide
- [x] **1.3.2** `auth.validation.js` — Schémas Joi pour login, refresh, change-password, enable 2FA, verify 2FA
- [x] **1.3.3** `auth.service.js` — Logique métier :
  - Login universel (internal + client), vérifier is_active, bcrypt compare, générer access+refresh tokens
  - Gestion refresh token (hash en DB, rotation, révocation)
  - Change password (vérif ancien mot de passe, hash nouveau)
  - 2FA : générer secret TOTP (speakeasy), vérifier code, activer/désactiver
  - Mise à jour last_login_at
- [x] **1.3.4** `auth.controller.js` — Routes : POST login, POST logout, POST refresh, POST change-password, POST 2fa/enable, POST 2fa/verify, POST 2fa/disable, GET /me
- [x] **1.3.5** `auth.routes.js` — Câblage routes + middlewares (rate-limit auth = 5 req/15min)
- [x] **1.3.6** `auth.swagger.js` — Documentation Swagger complète de toutes les routes auth
- [x] **1.3.7** Tester manuellement : login super_admin, obtenir token, refresh, /me

### 1.4 — Middlewares Tenant & Role

- [x] **1.4.1** `tenant.middleware.js` :
  - Si `user_type === 'client'` → `req.tenantId = req.user.organization_id` (forcé, non modifiable)
  - Si `user_type === 'internal'` → `req.tenantId = req.query.organizationId || null`
  - Validation que l'organizationId passé existe si fourni
- [x] **1.4.2** `role.middleware.js` :
  - Matrice de permissions complète (toutes les permissions listées dans proposition.md §6)
  - Middleware factory `authorize(...permissions)` vérifiant `req.user.role`
- [x] **1.4.3** `validate.middleware.js` — Wrapper générique pour validation Joi (body, query, params)
- [x] **1.4.4** `audit.middleware.js` — Logger automatique des mutations (POST/PUT/PATCH/DELETE), fire-and-forget async
- [x] **1.4.5** `upload.middleware.js` — Configuration Multer (destination, limites taille, filtres MIME)
- [x] **1.4.6** `errorHandler.middleware.js` — Gestion centralisée des erreurs, format ApiError standardisé

### 1.5 — Module Organizations

- [x] **1.5.1** `organization.repository.js` — CRUD Sequelize avec support tenant filtering
- [x] **1.5.2** `organization.service.js` — Logique métier : création, modification, activation/désactivation, stats par org
- [x] **1.5.3** `organization.validation.js` — Schémas Joi (create, update, patch status, query filters)
- [x] **1.5.4** `organization.controller.js` — GET /, POST /, GET /:id, PUT /:id, PATCH /:id/status, GET /:id/users, GET /:id/projects, GET /:id/stats
- [x] **1.5.5** `organization.routes.js` — Câblage avec auth + role middleware (accès internal seulement)
- [x] **1.5.6** `organization.swagger.js` — Documentation Swagger complète

### 1.6 — Module Users

- [x] **1.6.1** `user.repository.js` — CRUD avec tenant filtering, séparation internal/client queries
- [x] **1.6.2** `user.service.js` — Logique métier :
  - Créer user internal (super_admin only) / user client (admin+ ou client_admin pour sa propre org)
  - Modifier profil, changer rôle, activer/désactiver
  - Hash password à la création, ne jamais retourner password_hash
  - Contraintes : client → organization_id obligatoire, rôles client_* ↔ user_type client
- [x] **1.6.3** `user.validation.js` — Schémas Joi (create internal, create client, update, change role)
- [x] **1.6.4** `user.controller.js` — GET /internal, POST /internal, PATCH /internal/:id/role, GET /clients, POST /clients, PATCH /clients/:id/role, GET /:id, PUT /:id, PATCH /:id/status, DELETE /:id
- [x] **1.6.5** `user.routes.js` — Câblage avec auth + role + tenant middlewares
- [x] **1.6.6** `user.swagger.js` — Documentation Swagger complète

### 1.7 — Module Projects

- [x] **1.7.1** `project.repository.js` — CRUD avec tenant filtering, includes (organization, managers, contact)
- [x] **1.7.2** `project.service.js` — Logique métier : création (internal only), modification, changement statut, archivage, stats dashboard
- [x] **1.7.3** `project.validation.js` — Schémas Joi
- [x] **1.7.4** `project.controller.js` — GET / (adapté user_type), POST /, GET /dashboard/stats, GET /:id, PUT /:id, PATCH /:id/status, DELETE /:id
- [x] **1.7.5** `project.routes.js` + `project.swagger.js`

### 1.8 — Module Briefs

- [x] **1.8.1** `brief.repository.js` — CRUD + gestion attachments
- [x] **1.8.2** `brief.service.js` — Création par internal OU client_contributor, gestion pièces jointes (Multer)
- [x] **1.8.3** `brief.validation.js` — Schémas Joi
- [x] **1.8.4** `brief.controller.js` — GET /, POST /, PUT /:id, POST /:id/attachments, DELETE /:id/attachments/:attachId
- [x] **1.8.5** `brief.routes.js` + `brief.swagger.js`

### 1.9 — Module Tasks

- [x] **1.9.1** `task.repository.js` — CRUD + filtrage visibility (client ne voit pas `internal_only`)
- [x] **1.9.2** `task.service.js` — Logique métier : création (internal only), filtrage auto visibility pour clients, commentaires (is_internal auto selon user_type)
- [x] **1.9.3** `task.validation.js` — Schémas Joi
- [x] **1.9.4** `task.controller.js` — GET /, POST /, GET /:id, PUT /:id, PATCH /:id/status, DELETE /:id, GET /:id/comments, POST /:id/comments, DELETE /:id/comments/:cid
- [x] **1.9.5** `task.routes.js` + `task.swagger.js`

### 1.10 — Module Proposals + Validations

- [x] **1.10.1** `proposal.repository.js` — CRUD + filtrage statut (client ne voit pas les drafts)
- [x] **1.10.2** `proposal.service.js` — Workflow complet :
  - Création (internal contributor+), versioning auto
  - Soumission au client (status → pending_client_validation, internal validator+)
  - Commentaires (is_internal auto)
  - Client ne voit que pending_client_validation/approved/needs_revision/rejected
- [x] **1.10.3** `validation.repository.js` + `validation.service.js` — Logique de validation :
  - Soumission décision (client_validator/client_admin) : approved/needs_revision/rejected
  - Vérification pas de double validation, proposal dans le bon état
  - Historique des validations
- [x] **1.10.4** Controllers, validations Joi, routes, swagger pour proposals + validations

### 1.11 — Module Publications

- [x] **1.11.1** `publication.repository.js` — CRUD avec tenant filtering
- [x] **1.11.2** `publication.service.js` — Gestion par internal, visible par client
- [x] **1.11.3** Controller, validation, routes, swagger

### 1.12 — Module Calendar

- [x] **1.12.1** `calendar.repository.js` — CRUD + filtrage visibility (client = `client_visible` seulement)
- [x] **1.12.2** `calendar.service.js` — Filtres : month/week, type, projectId, organizationId, status
- [x] **1.12.3** Controller, validation, routes, swagger

### 1.13 — Module Médiathèque

- [x] **1.13.1** `media.repository.js` — CRUD + logique is_global / organization_id
- [x] **1.13.2** `media.service.js` — Upload (Multer), filtrage par type/tags/search, téléchargement sécurisé
- [x] **1.13.3** Controller, validation, routes, swagger (dont GET /:id/download)

### 1.14 — Module Reporting

- [x] **1.14.1** `reporting.repository.js` — Requêtes agrégées (COUNT, AVG, GROUP BY)
- [x] **1.14.2** `reporting.service.js` — KPIs :
  - Overview (projets en cours, en attente, urgents, publications programmées)
  - Stats projets par statut/période
  - Stats utilisateurs (internal admin+ only)
  - Stats publications par canal/période
  - Stats validations (délais moyens, taux approbation)
  - Adapté user_type : internal = global, client = sa propre org
- [x] **1.14.3** Export PDF (pdfkit) + Export Excel (exceljs)
- [x] **1.14.4** Controller, validation, routes, swagger

### 1.15 — Module Audit

- [x] **1.15.1** `audit.repository.js` — Lecture seule (GET uniquement, JAMAIS delete/update)
- [x] **1.15.2** `audit.service.js` — Journal filtrable (userId, organizationId, action, entityType, dateRange, pagination)
- [x] **1.15.3** Controller, routes, swagger (internal admin+ seulement)

### 1.16 — Swagger Global

- [x] **1.16.1** `src/config/swagger.js` — Configuration globale : info, servers (localhost + prod), securitySchemes (Bearer JWT), tags
- [x] **1.16.2** Intégrer tous les fichiers `*.swagger.js` de chaque module
- [x] **1.16.3** Schémas réutilisables dans `components/schemas` (User, Organization, Project, Task, Brief, Proposal, etc.)
- [x] **1.16.4** Vérifier `/api-docs` accessible et fonctionnel, bouton "Authorize" opérationnel

### 1.17 — Seeders

- [x] **1.17.1** Seeder `organizations` : MIPISE (ministry) + API-ZF (agency)
- [x] **1.17.2** Seeder `users` internes : super_admin, admin, validator, contributor (avec mots de passe hashés bcrypt)
- [x] **1.17.3** Seeder `users` clients : MIPISE (client_admin, client_validator, client_reader) + API-ZF (client_admin, client_contributor)
- [x] **1.17.4** Seeder `projects` : 3 projets MIPISE + 2 projets API-ZF (statuts variés)
- [x] **1.17.5** Seeder `briefs` : 1 brief par projet avec description complète
- [x] **1.17.6** Seeder `tasks` : 2-3 tâches par projet (mix visibility internal_only / client_visible)
- [x] **1.17.7** Seeder `proposals` : 1-2 propositions par projet (dont au moins une en pending_client_validation)
- [x] **1.17.8** Seeder `media` : 3 médias globaux (is_global=true)
- [x] **1.17.9** Exécuter `db:seed:all` et vérifier que les données sont cohérentes

### 1.18 — Tests & Validation Backend

- [x] **1.18.1** Tests unitaires : tenant.middleware, role.middleware, ApiError, pagination
- [x] **1.18.2** Tests d'intégration : auth (login, refresh, 2FA flow)
- [x] **1.18.3** Tests d'intégration : isolation multi-tenant (un client ne voit pas les données d'une autre org)
- [x] **1.18.4** Tests d'intégration : permissions (client_reader ne peut pas soumettre de validation)
- [x] **1.18.5** Tests d'intégration : workflow proposals (create draft → submit → client validate)
- [x] **1.18.6** Vérification finale : `npm run dev` ✅, `db:migrate` ✅, `db:seed:all` ✅, `/api-docs` ✅
- [x] **1.18.7** Créer `README.md` backend : instructions démarrage, architecture, users de test, endpoints principaux

---

## PHASE 2 — BACKOFFICE (`/backoffice`) — Frontend Golden Studio (internal users)

> **Stack** : React 18 + Vite + React Router v6 + Axios + TailwindCSS
> **Design** (CDC §IV) : Fond blanc/gris très clair, noir profond titres, accent bleu institutionnel, icônes minimalistes, espaces aérés, 3 clics max pour toute information

### 2.1 — Setup & Infrastructure Backoffice

- [x] **2.1.1** Initialiser projet React avec Vite (`npm create vite@latest backoffice -- --template react`)
- [x] **2.1.2** Installer dépendances :
  - TailwindCSS + PostCSS + Autoprefixer
  - React Router v6
  - Axios (instance configurée avec interceptors)
  - Zustand ou React Context (state management)
  - React Hook Form + Zod/Yup (formulaires)
  - Lucide React ou React Icons (icônes minimalistes)
  - date-fns (dates)
  - react-hot-toast (notifications)
  - recharts (graphiques reporting)
  - @tanstack/react-table (tableaux)
  - react-big-calendar (calendrier)
- [x] **2.1.3** Configurer TailwindCSS avec palette institutionnelle :
  - Primary : bleu institutionnel (`#1E3A5F` ou similaire)
  - Background : blanc `#FFFFFF` / gris très clair `#F8F9FA`
  - Texte titres : noir profond `#1A1A1A`
  - Texte secondaire : `#6B7280`
  - Accents : success green, warning amber, danger red
- [x] **2.1.4** Configurer Axios : instance avec `baseURL`, interceptors pour JWT auto-refresh, gestion erreurs globale
- [x] **2.1.5** Créer structure de dossiers :
  ```
  src/
  ├── api/           (services API par module)
  ├── assets/        (images, fonts)
  ├── components/    (composants réutilisables)
  │   ├── ui/        (Button, Input, Modal, Table, Badge, Card...)
  │   └── layout/    (Sidebar, Header, MainLayout)
  ├── contexts/      (AuthContext, ThemeContext)
  ├── hooks/         (useAuth, usePagination, useDebounce...)
  ├── pages/         (pages par module)
  ├── routes/        (routing config + guards)
  ├── utils/         (helpers, constants, formatters)
  └── styles/        (global CSS, tailwind config)
  ```

### 2.2 — Auth & Layout Backoffice

- [x] **2.2.1** Page Login (`/login`) : formulaire email/password, gestion erreurs, redirection post-login
- [x] **2.2.2** Étape 2FA : si 2fa_enabled → écran saisie code TOTP après login
- [x] **2.2.3** `AuthContext` : stocker user + tokens, auto-refresh, logout global
- [x] **2.2.4** Route Guard : `ProtectedRoute` component (vérifie auth + rôle), redirection si non autorisé
- [x] **2.2.5** Layout principal :
  - **Sidebar fixe gauche** (menu latéral CDC §IV) : Dashboard, Projets, Tâches, Calendrier, Médiathèque, Reporting, Utilisateurs, Paramètres — icônes minimalistes + labels
  - **Header top** : nom utilisateur, avatar, rôle, bouton logout, notifications
  - **Zone contenu principale** : breadcrumb + contenu de page
- [x] **2.2.6** Responsive : sidebar collapsible sur écrans moyens, priorité desktop (CDC §V)

### 2.3 — Module Dashboard Backoffice (MODULE 1 CDC)

- [x] **2.3.1** Vue synthétique temps réel :
  - Cards KPI : projets en cours, en attente validation, urgents, publications programmées, projets terminés
  - Graphiques (recharts) : projets par statut, publications par canal, tendance mensuelle
- [x] **2.3.2** Filtres dynamiques (CDC) : par agence/org, par direction, par statut, par priorité, par période
- [x] **2.3.3** Liste des dernières activités / audit récent
- [x] **2.3.4** Accès rapide aux projets urgents et en attente de validation

### 2.4 — Module Projets Backoffice (MODULE 2 CDC)

- [x] **2.4.1** Liste des projets : tableau paginé avec filtres (statut, priorité, organisation, période, recherche)
- [x] **2.4.2** Création de projet : formulaire complet (titre, org, direction, managers, contact client, priorité, date cible)
- [x] **2.4.3** Fiche projet détaillée avec sous-sections (onglets ou navigation interne) :
  - **Brief initial** : description, objectif, cible, message clé, deadline, documents joints
  - **Tâches** : liste / vue Kanban / vue chronologique (3 vues - CDC §MODULE 2)
  - **Propositions déposées** : versions horodatées, commentaires, auteur, validateur
  - **Historique validation** : tableau date, validateur, commentaires, statut (Validé/À modifier/Refusé)
  - **Statut publication** : date, canal, lien, archive
- [x] **2.4.4** Changement de statut projet (workflow : brief_received → in_production → in_validation → published → archived)
- [x] **2.4.5** Archivage / suppression (soft delete)

### 2.5 — Module Tâches Backoffice (MODULE 3 CDC)

- [x] **2.5.1** Vue transversale toutes tâches tous projets (CDC §MODULE 3 — pilotage opérationnel)
- [x] **2.5.2** Filtres : par collaborateur, par statut, par projet, overdue, urgent
- [x] **2.5.3** Vue Kanban (colonnes : todo, in_progress, done, blocked)
- [x] **2.5.4** Création / édition tâche : titre, description, assignation, date limite, priorité, visibility (internal_only / client_visible)
- [x] **2.5.5** Commentaires sur tâche (is_internal affiché différemment, badge "interne")
- [x] **2.5.6** Indicateurs visuels : retards en rouge, urgences avec badge

### 2.6 — Module Propositions & Validations Backoffice

- [x] **2.6.1** Liste propositions par projet : toutes versions, statut, auteur
- [x] **2.6.2** Création proposition : upload fichier, titre, description, version auto-incrémentée
- [x] **2.6.3** Workflow visuel : draft → submitted → pending_client_validation → approved/needs_revision/rejected
- [x] **2.6.4** Soumission au client : bouton "Soumettre pour validation" (change status)
- [x] **2.6.5** Commentaires : distinction visuelle commentaires internes vs visibles par client
- [x] **2.6.6** Historique validations : timeline avec décisions, commentaires, dates

### 2.7 — Module Calendrier Backoffice (MODULE 4 CDC)

- [x] **2.7.1** Vue calendrier mensuelle + hebdomadaire (react-big-calendar)
- [x] **2.7.2** Types d'événements (CDC) : publications prévues, événements à couvrir, tournages, dépôts livrables, réunions
- [x] **2.7.3** Code couleur selon statut (CDC) : en attente, validé, programmé, publié
- [x] **2.7.4** Création / édition événement : titre, type, dates, projet associé, org, visibility, statut
- [x] **2.7.5** Filtres : par org, par type, par projet

### 2.8 — Module Médiathèque Backoffice (MODULE 5 CDC)

- [x] **2.8.1** Grille de médias avec vignettes / vue liste
- [x] **2.8.2** Upload de fichiers : drag & drop, barre de progression
- [x] **2.8.3** Système de tags (CDC) : ajout/suppression de tags sur chaque média
- [x] **2.8.4** Moteur de recherche (CDC) : recherche par nom, tags, type
- [x] **2.8.5** Classement par agence/org (CDC)
- [x] **2.8.6** Types de médias : logos, chartes graphiques, vidéos, photos, templates, documents
- [x] **2.8.7** Téléchargement de fichiers, prévisualisation images/PDF

### 2.9 — Module Reporting Backoffice (MODULE 6 CDC)

- [x] **2.9.1** Tableau de bord KPIs :
  - Nombre de publications, couverture événementielle
  - Temps moyen de validation
  - Taux d'approbation
  - Projets par statut, par org
- [x] **2.9.2** Graphiques interactifs (recharts) : évolution temporelle, répartition par canal
- [x] **2.9.3** Filtres : par org, par période, par type
- [x] **2.9.4** Export PDF + Export Excel (téléchargement depuis l'API)

### 2.10 — Module Utilisateurs Backoffice (MODULE 7 CDC)

- [x] **2.10.1** Liste utilisateurs internes : tableau avec statut, rôle, actions
- [x] **2.10.2** Liste utilisateurs clients : filtrables par org, rôle
- [x] **2.10.3** Création utilisateur internal (super_admin) / client (admin+)
- [x] **2.10.4** Modification profil, changement rôle, activation/désactivation
- [x] **2.10.5** Badge rôle coloré (CDC §MODULE 7 — 🔵🟢🟡🟠⚪)

### 2.11 — Module Organisations Backoffice

- [x] **2.11.1** Liste organisations : tableau avec type, statut actif, nombre projets/users
- [x] **2.11.2** Création / édition organisation : formulaire complet
- [x] **2.11.3** Fiche organisation : détail, stats, liste users, liste projets
- [x] **2.11.4** Activation / désactivation organisation

### 2.12 — Module Audit / Traçabilité Backoffice (MODULE 8 CDC)

- [x] **2.12.1** Journal d'activité : tableau paginé avec filtres (utilisateur, org, action, type, période)
- [x] **2.12.2** Détail d'une entrée d'audit : avant/après (old_value / new_value)
- [x] **2.12.3** Aucun bouton supprimer/modifier (CDC : historique non supprimable)

### 2.13 — Paramètres Backoffice

- [x] **2.13.1** Page profil utilisateur connecté : modification infos, changement mot de passe
- [x] **2.13.2** Gestion 2FA : activation/désactivation, QR code display
- [x] **2.13.3** Paramètres plateforme (super_admin) : configuration globale si nécessaire

### 2.14 — Finitions Backoffice

- [x] **2.14.1** Gestion états vides (empty states) : illustrations + messages quand pas de données
- [x] **2.14.2** Loading states : skeletons / spinners cohérents
- [x] **2.14.3** Gestion erreurs globale : toast notifications, page 404, page 403
- [x] **2.14.4** Responsive final : vérifier toutes les pages desktop + tablette
- [x] **2.14.5** Performance : lazy loading des pages (React.lazy + Suspense), optimisation bundle

---

## PHASE 3 — INTÉGRATION CLIENT (Frontend Unifié)

> **Approche** : Un seul frontend (`/backoffice`) avec accès différencié par rôle (`user_type: internal | client`).
> Le backend isole déjà les données par `organization_id`. Le frontend adapte l'affichage :
> Sidebar limitée, boutons d'action masqués, pages admin protégées par `AdminRoute`.
> **Avantages** : 0 duplication de code, 1 seul build, composants UI partagés, maintenance simplifiée.

### 3.1 — Architecture & Guards

- [ ] **3.1.1** `AdminRoute.jsx` — Guard bloquant l'accès aux pages internes (redirect `/403`)
- [ ] **3.1.2** Modifier `ProtectedRoute.jsx` — Autoriser les `user_type === 'client'` (retirer le blocage actuel)
- [ ] **3.1.3** Modifier `App.jsx` — Wrapper les routes admin-only (Organisations, Users, Audit, Reporting) avec `AdminRoute`
- [ ] **3.1.4** Routes partagées : Dashboard, Projets, Tâches, Propositions, Calendrier, Média, Profil, Settings

### 3.2 — Sidebar & Header Adaptatifs

- [ ] **3.2.1** `Sidebar.jsx` — Filtrer les `navItems` par `user_type` en plus de `roles` :
  - Client voit : Dashboard, Projets, Tâches (client_visible), Propositions, Calendrier, Médiathèque
  - Client_admin voit en plus : Utilisateurs (de son org)
  - Internal voit tout (comme actuellement)
- [ ] **3.2.2** `Header.jsx` — Afficher le nom de l'organisation pour les clients
- [ ] **3.2.3** Logo / branding conditionnel (optionnel)

### 3.3 — Dashboard Client (conditionnel dans DashboardPage)

- [ ] **3.3.1** KPIs adaptés au client : projets de mon org, en attente de ma validation, publications récentes
- [ ] **3.3.2** Notifications : propositions soumises en attente de validation
- [ ] **3.3.3** Dernières activités sur les projets de l'org (backend filtre déjà par `organization_id`)

### 3.4 — Pages Partagées — Restrictions Client

- [ ] **3.4.1** `ProjectsPage` — Masquer bouton "Nouveau projet" pour les clients (création = internal only)
- [ ] **3.4.2** `ProjectDetailPage` — Client : pas d'onglet tâches internes, pas de propositions draft, pas de changement statut
- [ ] **3.4.3** `TasksPage` — Backend filtre `internal_only` automatiquement. Masquer bouton "Nouvelle tâche" pour clients.
- [ ] **3.4.4** `ProposalsPage` — Client voit `pending_client_validation`, `approved`, `needs_revision`, `rejected` (PAS drafts). Client_validator peut valider.
- [ ] **3.4.5** `CalendarPage` — Lecture seule pour client (pas de création d'événement). Backend filtre `client_visible`.
- [ ] **3.4.6** `MediaPage` — Client voit médias de son org + globaux. Upload seulement pour `client_contributor+`.

### 3.5 — Validation des Propositions (Client)

- [ ] **3.5.1** Bouton "Valider / Réviser / Rejeter" visible pour `client_validator` et `client_admin`
- [ ] **3.5.2** Commentaires : masquer `is_internal` automatiquement côté backend
- [ ] **3.5.3** Historique validations accessible en lecture

### 3.6 — Gestion Utilisateurs Client (client_admin)

- [ ] **3.6.1** `UsersPage` conditionnel — client_admin voit uniquement les users de son org
- [ ] **3.6.2** Création d'utilisateur client dans son org
- [ ] **3.6.3** Modification rôle, activation/désactivation (limité aux rôles client_*)

### 3.7 — Suppression dossier `/client`

- [ ] **3.7.1** Supprimer le dossier `client/` (vide, inutile avec le frontend unifié)

---

## PHASE 4 — INTÉGRATION & DÉPLOIEMENT

### 4.1 — Tests End-to-End

- [ ] **4.1.1** Scénario complet admin : login admin → créer org → créer user client → créer projet → brief → tâches → proposition → soumettre au client
- [ ] **4.1.2** Scénario complet client : login client_validator → voir projets → voir proposition → valider → vérifier historique
- [ ] **4.1.3** Test isolation : login 2 clients différents, vérifier qu'ils ne voient pas les données de l'autre
- [ ] **4.1.4** Test permissions : tenter actions interdites et vérifier les rejets (client ne crée pas de projet, client_reader ne valide pas)

### 4.2 — Documentation

- [ ] **4.2.1** `README.md` racine : vue d'ensemble, architecture 2 parties (backend + frontend unifié), instructions démarrage
- [ ] **4.2.2** `backend/README.md` : setup DB, migrations, seeders, endpoints, users test
- [ ] **4.2.3** `backoffice/README.md` : démarrage dev, structure pages, rôles & accès, variables env

### 4.3 — Préparation Production

- [ ] **4.3.1** Variables d'environnement production sécurisées
- [ ] **4.3.2** Build backoffice + client (`npm run build`)
- [ ] **4.3.3** Configuration CORS production
- [ ] **4.3.4** Configuration reverse proxy (Nginx) si applicable
- [ ] **4.3.5** Backup DB strategy
- [ ] **4.3.6** CI/CD pipeline (optionnel phase 1)

---

## PHASE 5 — ÉVOLUTIONS FUTURES (CDC §VI — Phase 2)

- [ ] **5.1** Intelligence artificielle pour analyse KPI
- [ ] **5.2** Suggestion éditoriale automatisée
- [ ] **5.3** Automatisation planning
- [ ] **5.4** API réseaux sociaux (Facebook, LinkedIn, etc.)
- [ ] **5.5** Signature électronique intégrée
- [ ] **5.6** Notifications temps réel (WebSocket / SSE)
- [ ] **5.7** Application mobile (React Native)

---

## RAPPELS TRANSVERSAUX (à respecter à chaque étape)

| Règle | Détail |
|---|---|
| **Architecture** | Controller → Service → Repository (zéro logique métier dans controller) |
| **Isolation tenant** | Chaque requête client filtrée par `organization_id` automatiquement |
| **Sécurité** | bcrypt 12 rounds, JWT 15min/7j, Helmet, CORS, rate-limit |
| **Format API** | `{ success, data, message, meta }` ou `{ success, error: { code, message, details } }` |
| **Pagination** | Obligatoire sur tous les listings (default: 20, max: 100) |
| **UUID** | Tous les IDs, pas d'auto-increment exposé |
| **Soft delete** | `is_active` pour Users/Orgs, `status: 'archived'` pour Projects |
| **Audit immutable** | Aucun DELETE/UPDATE sur audit_logs |
| **Visibilité** | `internal_only` tâches/events + `is_internal` commentaires JAMAIS visibles côté client |
| **Logs** | Winston uniquement, jamais `console.log`, jamais de données sensibles |
| **UX Frontend** | Fond blanc/gris clair, bleu institutionnel, icônes mini, espaces aérés, 3 clics max |
