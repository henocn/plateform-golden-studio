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

- [ ] **1.16.1** `src/config/swagger.js` — Configuration globale : info, servers (localhost + prod), securitySchemes (Bearer JWT), tags
- [ ] **1.16.2** Intégrer tous les fichiers `*.swagger.js` de chaque module
- [ ] **1.16.3** Schémas réutilisables dans `components/schemas` (User, Organization, Project, Task, Brief, Proposal, etc.)
- [ ] **1.16.4** Vérifier `/api-docs` accessible et fonctionnel, bouton "Authorize" opérationnel

### 1.17 — Seeders

- [ ] **1.17.1** Seeder `organizations` : MIPISE (ministry) + API-ZF (agency)
- [ ] **1.17.2** Seeder `users` internes : super_admin, admin, validator, contributor (avec mots de passe hashés bcrypt)
- [ ] **1.17.3** Seeder `users` clients : MIPISE (client_admin, client_validator, client_reader) + API-ZF (client_admin, client_contributor)
- [ ] **1.17.4** Seeder `projects` : 3 projets MIPISE + 2 projets API-ZF (statuts variés)
- [ ] **1.17.5** Seeder `briefs` : 1 brief par projet avec description complète
- [ ] **1.17.6** Seeder `tasks` : 2-3 tâches par projet (mix visibility internal_only / client_visible)
- [ ] **1.17.7** Seeder `proposals` : 1-2 propositions par projet (dont au moins une en pending_client_validation)
- [ ] **1.17.8** Seeder `media` : 3 médias globaux (is_global=true)
- [ ] **1.17.9** Exécuter `db:seed:all` et vérifier que les données sont cohérentes

### 1.18 — Tests & Validation Backend

- [ ] **1.18.1** Tests unitaires : tenant.middleware, role.middleware, ApiError, pagination
- [ ] **1.18.2** Tests d'intégration : auth (login, refresh, 2FA flow)
- [ ] **1.18.3** Tests d'intégration : isolation multi-tenant (un client ne voit pas les données d'une autre org)
- [ ] **1.18.4** Tests d'intégration : permissions (client_reader ne peut pas soumettre de validation)
- [ ] **1.18.5** Tests d'intégration : workflow proposals (create draft → submit → client validate)
- [ ] **1.18.6** Vérification finale : `npm run dev` ✅, `db:migrate` ✅, `db:seed:all` ✅, `/api-docs` ✅
- [ ] **1.18.7** Créer `README.md` backend : instructions démarrage, architecture, users de test, endpoints principaux

---

## PHASE 2 — BACKOFFICE (`/backoffice`) — Frontend Golden Studio (internal users)

> **Stack** : React 18 + Vite + React Router v6 + Axios + TailwindCSS
> **Design** (CDC §IV) : Fond blanc/gris très clair, noir profond titres, accent bleu institutionnel, icônes minimalistes, espaces aérés, 3 clics max pour toute information

### 2.1 — Setup & Infrastructure Backoffice

- [ ] **2.1.1** Initialiser projet React avec Vite (`npm create vite@latest backoffice -- --template react`)
- [ ] **2.1.2** Installer dépendances :
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
- [ ] **2.1.3** Configurer TailwindCSS avec palette institutionnelle :
  - Primary : bleu institutionnel (`#1E3A5F` ou similaire)
  - Background : blanc `#FFFFFF` / gris très clair `#F8F9FA`
  - Texte titres : noir profond `#1A1A1A`
  - Texte secondaire : `#6B7280`
  - Accents : success green, warning amber, danger red
- [ ] **2.1.4** Configurer Axios : instance avec `baseURL`, interceptors pour JWT auto-refresh, gestion erreurs globale
- [ ] **2.1.5** Créer structure de dossiers :
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

- [ ] **2.2.1** Page Login (`/login`) : formulaire email/password, gestion erreurs, redirection post-login
- [ ] **2.2.2** Étape 2FA : si 2fa_enabled → écran saisie code TOTP après login
- [ ] **2.2.3** `AuthContext` : stocker user + tokens, auto-refresh, logout global
- [ ] **2.2.4** Route Guard : `ProtectedRoute` component (vérifie auth + rôle), redirection si non autorisé
- [ ] **2.2.5** Layout principal :
  - **Sidebar fixe gauche** (menu latéral CDC §IV) : Dashboard, Projets, Tâches, Calendrier, Médiathèque, Reporting, Utilisateurs, Paramètres — icônes minimalistes + labels
  - **Header top** : nom utilisateur, avatar, rôle, bouton logout, notifications
  - **Zone contenu principale** : breadcrumb + contenu de page
- [ ] **2.2.6** Responsive : sidebar collapsible sur écrans moyens, priorité desktop (CDC §V)

### 2.3 — Module Dashboard Backoffice (MODULE 1 CDC)

- [ ] **2.3.1** Vue synthétique temps réel :
  - Cards KPI : projets en cours, en attente validation, urgents, publications programmées, projets terminés
  - Graphiques (recharts) : projets par statut, publications par canal, tendance mensuelle
- [ ] **2.3.2** Filtres dynamiques (CDC) : par agence/org, par direction, par statut, par priorité, par période
- [ ] **2.3.3** Liste des dernières activités / audit récent
- [ ] **2.3.4** Accès rapide aux projets urgents et en attente de validation

### 2.4 — Module Projets Backoffice (MODULE 2 CDC)

- [ ] **2.4.1** Liste des projets : tableau paginé avec filtres (statut, priorité, organisation, période, recherche)
- [ ] **2.4.2** Création de projet : formulaire complet (titre, org, direction, managers, contact client, priorité, date cible)
- [ ] **2.4.3** Fiche projet détaillée avec sous-sections (onglets ou navigation interne) :
  - **Brief initial** : description, objectif, cible, message clé, deadline, documents joints
  - **Tâches** : liste / vue Kanban / vue chronologique (3 vues - CDC §MODULE 2)
  - **Propositions déposées** : versions horodatées, commentaires, auteur, validateur
  - **Historique validation** : tableau date, validateur, commentaires, statut (Validé/À modifier/Refusé)
  - **Statut publication** : date, canal, lien, archive
- [ ] **2.4.4** Changement de statut projet (workflow : brief_received → in_production → in_validation → published → archived)
- [ ] **2.4.5** Archivage / suppression (soft delete)

### 2.5 — Module Tâches Backoffice (MODULE 3 CDC)

- [ ] **2.5.1** Vue transversale toutes tâches tous projets (CDC §MODULE 3 — pilotage opérationnel)
- [ ] **2.5.2** Filtres : par collaborateur, par statut, par projet, overdue, urgent
- [ ] **2.5.3** Vue Kanban (colonnes : todo, in_progress, done, blocked)
- [ ] **2.5.4** Création / édition tâche : titre, description, assignation, date limite, priorité, visibility (internal_only / client_visible)
- [ ] **2.5.5** Commentaires sur tâche (is_internal affiché différemment, badge "interne")
- [ ] **2.5.6** Indicateurs visuels : retards en rouge, urgences avec badge

### 2.6 — Module Propositions & Validations Backoffice

- [ ] **2.6.1** Liste propositions par projet : toutes versions, statut, auteur
- [ ] **2.6.2** Création proposition : upload fichier, titre, description, version auto-incrémentée
- [ ] **2.6.3** Workflow visuel : draft → submitted → pending_client_validation → approved/needs_revision/rejected
- [ ] **2.6.4** Soumission au client : bouton "Soumettre pour validation" (change status)
- [ ] **2.6.5** Commentaires : distinction visuelle commentaires internes vs visibles par client
- [ ] **2.6.6** Historique validations : timeline avec décisions, commentaires, dates

### 2.7 — Module Calendrier Backoffice (MODULE 4 CDC)

- [ ] **2.7.1** Vue calendrier mensuelle + hebdomadaire (react-big-calendar)
- [ ] **2.7.2** Types d'événements (CDC) : publications prévues, événements à couvrir, tournages, dépôts livrables, réunions
- [ ] **2.7.3** Code couleur selon statut (CDC) : en attente, validé, programmé, publié
- [ ] **2.7.4** Création / édition événement : titre, type, dates, projet associé, org, visibility, statut
- [ ] **2.7.5** Filtres : par org, par type, par projet

### 2.8 — Module Médiathèque Backoffice (MODULE 5 CDC)

- [ ] **2.8.1** Grille de médias avec vignettes / vue liste
- [ ] **2.8.2** Upload de fichiers : drag & drop, barre de progression
- [ ] **2.8.3** Système de tags (CDC) : ajout/suppression de tags sur chaque média
- [ ] **2.8.4** Moteur de recherche (CDC) : recherche par nom, tags, type
- [ ] **2.8.5** Classement par agence/org (CDC)
- [ ] **2.8.6** Types de médias : logos, chartes graphiques, vidéos, photos, templates, documents
- [ ] **2.8.7** Téléchargement de fichiers, prévisualisation images/PDF

### 2.9 — Module Reporting Backoffice (MODULE 6 CDC)

- [ ] **2.9.1** Tableau de bord KPIs :
  - Nombre de publications, couverture événementielle
  - Temps moyen de validation
  - Taux d'approbation
  - Projets par statut, par org
- [ ] **2.9.2** Graphiques interactifs (recharts) : évolution temporelle, répartition par canal
- [ ] **2.9.3** Filtres : par org, par période, par type
- [ ] **2.9.4** Export PDF + Export Excel (téléchargement depuis l'API)

### 2.10 — Module Utilisateurs Backoffice (MODULE 7 CDC)

- [ ] **2.10.1** Liste utilisateurs internes : tableau avec statut, rôle, actions
- [ ] **2.10.2** Liste utilisateurs clients : filtrables par org, rôle
- [ ] **2.10.3** Création utilisateur internal (super_admin) / client (admin+)
- [ ] **2.10.4** Modification profil, changement rôle, activation/désactivation
- [ ] **2.10.5** Badge rôle coloré (CDC §MODULE 7 — 🔵🟢🟡🟠⚪)

### 2.11 — Module Organisations Backoffice

- [ ] **2.11.1** Liste organisations : tableau avec type, statut actif, nombre projets/users
- [ ] **2.11.2** Création / édition organisation : formulaire complet
- [ ] **2.11.3** Fiche organisation : détail, stats, liste users, liste projets
- [ ] **2.11.4** Activation / désactivation organisation

### 2.12 — Module Audit / Traçabilité Backoffice (MODULE 8 CDC)

- [ ] **2.12.1** Journal d'activité : tableau paginé avec filtres (utilisateur, org, action, type, période)
- [ ] **2.12.2** Détail d'une entrée d'audit : avant/après (old_value / new_value)
- [ ] **2.12.3** Aucun bouton supprimer/modifier (CDC : historique non supprimable)

### 2.13 — Paramètres Backoffice

- [ ] **2.13.1** Page profil utilisateur connecté : modification infos, changement mot de passe
- [ ] **2.13.2** Gestion 2FA : activation/désactivation, QR code display
- [ ] **2.13.3** Paramètres plateforme (super_admin) : configuration globale si nécessaire

### 2.14 — Finitions Backoffice

- [ ] **2.14.1** Gestion états vides (empty states) : illustrations + messages quand pas de données
- [ ] **2.14.2** Loading states : skeletons / spinners cohérents
- [ ] **2.14.3** Gestion erreurs globale : toast notifications, page 404, page 403
- [ ] **2.14.4** Responsive final : vérifier toutes les pages desktop + tablette
- [ ] **2.14.5** Performance : lazy loading des pages (React.lazy + Suspense), optimisation bundle

---

## PHASE 3 — CLIENT PORTAL (`/client`) — Frontend Institutions

> **Stack** : React 18 + Vite + React Router v6 + Axios + TailwindCSS (même stack que backoffice)
> **Principes** : Le client ne voit QUE ses propres données (isolation par organization_id). Pas de drafts de propositions, pas de tâches internal_only, pas de commentaires internes.

### 3.1 — Setup & Infrastructure Client Portal

- [ ] **3.1.1** Initialiser projet React avec Vite (même template que backoffice)
- [ ] **3.1.2** Installer mêmes dépendances que backoffice
- [ ] **3.1.3** Configurer TailwindCSS avec même palette institutionnelle
- [ ] **3.1.4** Configurer Axios (même base URL, JWT interceptors)
- [ ] **3.1.5** Structure de dossiers identique au backoffice
- [ ] **3.1.6** Bibliothèque de composants UI partagée ou dupliquée (Button, Input, Modal, Table, Badge, Card...)

### 3.2 — Auth & Layout Client Portal

- [ ] **3.2.1** Page Login client (`/login`) : même formulaire, le backend différencie via user_type
- [ ] **3.2.2** Étape 2FA (si activé)
- [ ] **3.2.3** `AuthContext` client : stocker user + tokens, auto-refresh
- [ ] **3.2.4** Route Guard : `ProtectedRoute` vérifiant que user_type === 'client'
- [ ] **3.2.5** Layout client :
  - **Sidebar fixe** (adapté au client) : Dashboard, Mes Projets, Calendrier, Médiathèque, Mon Organisation (si client_admin)
  - **Header** : nom organisation, nom utilisateur, rôle, logout
  - **Zone contenu** avec breadcrumb
- [ ] **3.2.6** Responsive desktop prioritaire

### 3.3 — Dashboard Client

- [ ] **3.3.1** KPIs de l'organisation : projets en cours, en attente de ma validation, publications récentes
- [ ] **3.3.2** Notifications : propositions soumises en attente de validation
- [ ] **3.3.3** Dernières activités sur les projets de l'org

### 3.4 — Module Projets Client

- [ ] **3.4.1** Liste des projets de mon organisation : tableau filtrables (statut, priorité, période)
- [ ] **3.4.2** Fiche projet (lecture + actions limitées) :
  - **Brief** : visualisation + possibilité de soumettre un brief (client_contributor+)
  - **Tâches visibles** (`client_visible` uniquement) : visualisation + commentaires
  - **Propositions** : uniquement celles en `pending_client_validation`, `approved`, `needs_revision`, `rejected` (PAS les drafts)
  - **Historique validations** : lecture
  - **Publications** : lecture

### 3.5 — Validation des Propositions Client

- [ ] **3.5.1** Liste des propositions en attente de ma validation (vue dédiée ou badge notification)
- [ ] **3.5.2** Détail proposition : visualisation fichier, commentaires (hors internes)
- [ ] **3.5.3** Action de validation : approuver / demander révision / rejeter + commentaire obligatoire
- [ ] **3.5.4** Historique de mes décisions de validation

### 3.6 — Soumission de Briefs Client

- [ ] **3.6.1** Formulaire de soumission de brief (client_contributor+) : description, objectif, cible, message clé, deadline
- [ ] **3.6.2** Upload pièces jointes (documents, images)
- [ ] **3.6.3** Visualisation de ses briefs soumis

### 3.7 — Calendrier Client

- [ ] **3.7.1** Vue calendrier mensuelle/hebdomadaire (événements `client_visible` de mon org uniquement)
- [ ] **3.7.2** Code couleur selon statut
- [ ] **3.7.3** Lecture seule (le client ne crée pas d'événements)

### 3.8 — Médiathèque Client

- [ ] **3.8.1** Médias de mon organisation + médias globaux (is_global=true)
- [ ] **3.8.2** Recherche, filtres par type/tags
- [ ] **3.8.3** Téléchargement de fichiers
- [ ] **3.8.4** Lecture seule (pas d'upload pour les clients sauf si client_contributor)

### 3.9 — Gestion Utilisateurs Client (client_admin uniquement)

- [ ] **3.9.1** Liste des utilisateurs de mon organisation
- [ ] **3.9.2** Création d'un utilisateur client dans mon org (client_admin)
- [ ] **3.9.3** Modification rôle, activation/désactivation

### 3.10 — Profil & Paramètres Client

- [ ] **3.10.1** Page profil : modification infos personnelles, changement mot de passe
- [ ] **3.10.2** Gestion 2FA : activation/désactivation

### 3.11 — Finitions Client Portal

- [ ] **3.11.1** Empty states et loading states
- [ ] **3.11.2** Gestion erreurs : toast, 404, 403 (tentative accès autre org → page "Accès refusé")
- [ ] **3.11.3** Responsive desktop + tablette
- [ ] **3.11.4** Performance : lazy loading, optimisation bundle

---

## PHASE 4 — INTÉGRATION & DÉPLOIEMENT

### 4.1 — Tests End-to-End

- [ ] **4.1.1** Scénario complet backoffice : login admin → créer org → créer user client → créer projet → brief → tâches → proposition → soumettre au client
- [ ] **4.1.2** Scénario complet client : login client_validator → voir projets → voir proposition → valider → vérifier historique
- [ ] **4.1.3** Test isolation : login 2 clients différents, vérifier qu'ils ne voient pas les données de l'autre
- [ ] **4.1.4** Test permissions : tenter actions interdites et vérifier les rejets

### 4.2 — Documentation

- [ ] **4.2.1** `README.md` racine : vue d'ensemble, architecture 3 parties, instructions démarrage global
- [ ] **4.2.2** `backend/README.md` : setup DB, migrations, seeders, endpoints, users test
- [ ] **4.2.3** `backoffice/README.md` : démarrage dev, structure pages, variables env
- [ ] **4.2.4** `client/README.md` : démarrage dev, structure pages, variables env

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
