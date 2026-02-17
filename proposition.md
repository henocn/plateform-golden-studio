### Plateforme B2B de Mise en Relation — Golden Studio × Institutions Clientes

Tu es un **architecte backend senior avec plus de 10ans d'expérience en Node.js/PostgreSQL**. Ta mission est de concevoir et développer, de manière professionnelle et production-ready, le **backend complet** d'une plateforme de gouvernance et de suivi de communication institutionnelle pour un ministère (et ses agences rattachées).

Cette plateforme s'appelle **GovCom Platform**.

Tu travailleras en suivant des **standards de code professionnels** : architecture modulaire, séparation des responsabilités (MVC + Service Layer + Repository Pattern), validation stricte des entrées, gestion centralisée des erreurs, sécurité enterprise-grade, et documentation Swagger exhaustive.
et toutes les api devraient normalement avoir cette sortie

## 1. VISION GLOBALE DE LA PLATEFORME

**GovCom Platform** est une plateforme **B2B multi-tenant** de gestion de communication institutionnelle.

Elle met en relation **deux parties** :

| Partie | Rôle | Portail |
|---|---|---|
| **Golden Studio** | Prestataire de services (agence) | **Backoffice** — gestion complète de tous les clients, projets, équipes, reporting global |
| **Institutions / Clients** | Ministères, agences, directions | **Client Portal** — vision de leurs propres projets uniquement, suivi, validation, briefs |

### Principe fondamental
- **Golden Studio** voit et gère TOUT (tous les clients, tous les projets, toutes les tâches)
- **Chaque client** ne voit **que ses propres données** (isolation stricte par `organization_id`)
- Les deux parties interagissent sur les **mêmes objets** (projets, tâches, propositions) mais avec des **vues et permissions différentes**
- Un projet est toujours **rattaché à une organization (client)** et **géré par Golden Studio**

---

## 2. MODÈLE UTILISATEUR & DROITS D'ACCÈS

### Deux types d'utilisateurs distincts

```
user_type: 'internal'   → Employés de Golden Studio (backoffice)
user_type: 'client'     → Utilisateurs d'une institution cliente
```

### Rôles côté INTERNAL (Golden Studio)

| Rôle | Périmètre |
|---|---|
| `super_admin` | Accès total — gestion platform, organisations, utilisateurs, tous modules |
| `admin` | Gestion des projets, clients, équipes, reporting |
| `validator` | Peut valider les propositions, changer les statuts |
| `contributor` | Peut créer/modifier projets, tâches, propositions, uploader médias |
| `reader` | Lecture seule sur tout |

### Rôles côté CLIENT (Institution)

| Rôle | Périmètre |
|---|---|
| `client_admin` | Gère les utilisateurs de son organisation, voit tout ce qui concerne son org |
| `client_validator` | Peut valider/refuser les propositions soumises par Golden Studio |
| `client_contributor` | Peut soumettre des briefs, commenter, uploader des documents |
| `client_reader` | Lecture seule sur les données de son organisation |

### Règle d'isolation des données (Multi-tenant)
- **Tout objet** (projet, tâche, proposition, media, calendrier...) porte un `organization_id`
- Les utilisateurs `client_*` sont filtrés **automatiquement** par leur `organization_id` dans chaque requête
- Ce filtrage est fait dans un **middleware dédié** `tenant.middleware.js`, transparent pour les controllers
- Les utilisateurs `internal` peuvent passer un paramètre `?organizationId=` pour filtrer par client

---

## 3. STACK TECHNIQUE OBLIGATOIRE

| Couche | Technologie |
|---|---|
| Runtime | Node.js 20 LTS |
| Framework | Express.js |
| Base de données | PostgreSQL 16 |
| ORM | Sequelize v6 (avec migrations) |
| Authentification | JWT (access token 15min + refresh token 7j) + 2FA TOTP (speakeasy) |
| Validation | Joi |
| Documentation API | Swagger UI (swagger-jsdoc + swagger-ui-express) |
| Upload fichiers | Multer (local + préparation interface S3) |
| Logs | Winston |
| Sécurité | Helmet, CORS, express-rate-limit, bcrypt |
| Tests | Jest + Supertest |
| Variables env | dotenv + envalid |

---

## 4. ARCHITECTURE DE DOSSIERS

```
govcom-backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   ├── swagger.js
│   │   └── env.js
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   ├── auth.validation.js
│   │   │   └── auth.swagger.js
│   │   ├── organizations/        ← Gestion des clients/institutions
│   │   │   ├── organization.routes.js
│   │   │   ├── organization.controller.js
│   │   │   ├── organization.service.js
│   │   │   ├── organization.repository.js
│   │   │   ├── organization.validation.js
│   │   │   └── organization.swagger.js
│   │   ├── users/                ← Internes + clients
│   │   ├── projects/
│   │   ├── tasks/
│   │   ├── briefs/
│   │   ├── proposals/
│   │   ├── validations/
│   │   ├── publications/
│   │   ├── calendar/
│   │   ├── mediatheque/
│   │   ├── reporting/
│   │   └── audit/
│   ├── models/
│   │   ├── index.js
│   │   ├── Organization.js       ← NOUVEAU — entité centrale client
│   │   ├── User.js
│   │   ├── Project.js
│   │   ├── Task.js
│   │   ├── TaskComment.js
│   │   ├── Brief.js
│   │   ├── BriefAttachment.js
│   │   ├── Proposal.js
│   │   ├── ProposalComment.js
│   │   ├── Validation.js
│   │   ├── Publication.js
│   │   ├── CalendarEvent.js
│   │   ├── Media.js
│   │   ├── AuditLog.js
│   │   └── RefreshToken.js
│   ├── middlewares/
│   │   ├── auth.middleware.js       ← Vérifie JWT, attache req.user
│   │   ├── role.middleware.js       ← Vérifie les rôles
│   │   ├── tenant.middleware.js     ← NOUVEAU — Filtre automatique par org
│   │   ├── validate.middleware.js
│   │   ├── upload.middleware.js
│   │   ├── audit.middleware.js
│   │   └── errorHandler.middleware.js
│   ├── utils/
│   │   ├── logger.js
│   │   ├── ApiResponse.js
│   │   ├── ApiError.js
│   │   └── pagination.js
│   └── app.js
├── database/
│   ├── migrations/
│   └── seeders/
├── tests/
├── uploads/
├── .env.example
├── .sequelizerc
├── package.json
└── server.js
```

---

## 5. BASE DE DONNÉES — SCHÉMA COMPLET

### Table `organizations` ← Entité centrale (institutions clientes)
```
id                UUID, PK
name              VARCHAR NOT NULL       (ex: "Ministère de l'Industrie")
short_name        VARCHAR                (ex: "MIPISE")
type              ENUM: 'ministry', 'agency', 'direction', 'other'
logo_path         VARCHAR nullable
contact_email     VARCHAR
contact_phone     VARCHAR
address           TEXT
is_active         BOOLEAN DEFAULT true
created_by        FK → users (super_admin qui a créé)
created_at / updated_at
```

### Table `users`
```
id                UUID, PK
email             VARCHAR UNIQUE NOT NULL
password_hash     VARCHAR NOT NULL
first_name        VARCHAR NOT NULL
last_name         VARCHAR NOT NULL
user_type         ENUM: 'internal', 'client'    ← CLEF DE VOÛTE
role              ENUM: 'super_admin', 'admin', 'validator', 'contributor', 'reader',
                        'client_admin', 'client_validator', 'client_contributor', 'client_reader'
organization_id   FK → organizations nullable    ← NULL si internal, OBLIGATOIRE si client
job_title         VARCHAR nullable
avatar_path       VARCHAR nullable
is_active         BOOLEAN DEFAULT true
two_factor_secret VARCHAR nullable
two_factor_enabled BOOLEAN DEFAULT false
last_login_at     TIMESTAMP nullable
created_by        FK → users nullable
created_at / updated_at

CONTRAINTE: si user_type = 'client' alors organization_id NOT NULL
CONTRAINTE: rôles 'client_*' uniquement pour user_type = 'client'
CONTRAINTE: rôles non-client uniquement pour user_type = 'internal'
```

### Table `projects`
```
id                    UUID, PK
organization_id       FK → organizations NOT NULL    ← Appartient à quel client
title                 VARCHAR NOT NULL
description           TEXT
agency_direction      VARCHAR   (direction interne du client ex: "Direction Communication")
internal_manager_id   FK → users (internal) — chef de projet côté Golden Studio
studio_manager_id     FK → users (internal) — responsable créatif côté Golden Studio
client_contact_id     FK → users (client)   — interlocuteur côté client
priority              ENUM: 'low', 'normal', 'high', 'urgent'
status                ENUM: 'brief_received', 'in_production', 'in_validation', 'published', 'archived'
target_date           DATE
created_by            FK → users
created_at / updated_at
```

### Table `briefs`
```
id                UUID, PK
project_id        FK → projects
organization_id   FK → organizations    ← Dénormalisé pour filtrage tenant rapide
description       TEXT NOT NULL
objective         TEXT
target_audience   TEXT
key_message       TEXT
deadline          DATE
submitted_by      FK → users            ← Peut être un utilisateur client (client_contributor)
created_at / updated_at
```

### Table `brief_attachments`
```
id              UUID, PK
brief_id        FK → briefs
organization_id FK → organizations
file_name       VARCHAR
file_path       VARCHAR
file_size       INTEGER
mime_type       VARCHAR
uploaded_by     FK → users
created_at
```

### Table `tasks`
```
id              UUID, PK
project_id      FK → projects
organization_id FK → organizations
title           VARCHAR NOT NULL
description     TEXT
assigned_to     FK → users nullable      ← Peut être internal ou client selon config
due_date        DATE
status          ENUM: 'todo', 'in_production', 'done', 'blocked', 'cancelled'
priority        ENUM: 'low', 'normal', 'high', 'urgent'
visibility      ENUM: 'internal_only', 'client_visible'  ← Tâches internes cachées au client
created_by      FK → users
created_at / updated_at
```

### Table `task_comments`
```
id              UUID, PK
task_id         FK → tasks
organization_id FK → organizations
user_id         FK → users
content         TEXT NOT NULL
is_internal     BOOLEAN DEFAULT false    ← Commentaire interne = invisible pour le client
created_at / updated_at
```

### Table `proposals`
```
id              UUID, PK
project_id      FK → projects
organization_id FK → organizations
version_number  INTEGER NOT NULL
title           VARCHAR
description     TEXT
file_path       VARCHAR nullable
author_id       FK → users (internal — créé par Golden Studio)
validator_id    FK → users nullable (client_validator qui valide)
status          ENUM: 'draft', 'submitted', 'pending_client_validation', 'approved', 'needs_revision', 'rejected'
submitted_at    TIMESTAMP nullable
created_at / updated_at
```
> Note status: 'draft' et 'submitted' = usage interne. 'pending_client_validation' = visible et actionnable par le client.

### Table `proposal_comments`
```
id              UUID, PK
proposal_id     FK → proposals
organization_id FK → organizations
user_id         FK → users
content         TEXT NOT NULL
is_internal     BOOLEAN DEFAULT false   ← Commentaire interne invisible côté client
created_at
```

### Table `validations`
```
id              UUID, PK
proposal_id     FK → proposals
organization_id FK → organizations
validator_id    FK → users              ← Peut être internal ou client_validator
status          ENUM: 'approved', 'needs_revision', 'rejected'
comments        TEXT
validated_at    TIMESTAMP
created_at
```

### Table `publications`
```
id               UUID, PK
project_id       FK → projects
organization_id  FK → organizations
proposal_id      FK → proposals nullable
publication_date TIMESTAMP
channel          ENUM: 'facebook', 'linkedin', 'official_release', 'website', 'tv', 'radio', 'other'
link             VARCHAR nullable
archive_path     VARCHAR nullable
created_by       FK → users
created_at / updated_at
```

### Table `calendar_events`
```
id              UUID, PK
organization_id FK → organizations
project_id      FK → projects nullable
title           VARCHAR NOT NULL
type            ENUM: 'publication', 'event_coverage', 'filming', 'deliverable_deadline', 'meeting'
start_date      TIMESTAMP NOT NULL
end_date        TIMESTAMP nullable
status          ENUM: 'pending', 'validated', 'scheduled', 'published', 'cancelled'
description     TEXT
visibility      ENUM: 'internal_only', 'client_visible'
created_by      FK → users
created_at / updated_at
```

### Table `media`
```
id              UUID, PK
organization_id FK → organizations nullable   ← NULL = ressource globale Golden Studio (chartes, logos génériques)
name            VARCHAR NOT NULL
type            ENUM: 'logo', 'graphic_charter', 'video', 'photo', 'template', 'document', 'other'
tags            JSONB
file_path       VARCHAR NOT NULL
file_name       VARCHAR NOT NULL
file_size       INTEGER
mime_type       VARCHAR
is_global       BOOLEAN DEFAULT false    ← true = visible par tous les clients
uploaded_by     FK → users
created_at / updated_at
```

### Table `audit_logs` ← NON SUPPRIMABLE, NON MODIFIABLE
```
id            UUID, PK
user_id       FK → users nullable
organization_id FK → organizations nullable
action        VARCHAR NOT NULL
entity_type   VARCHAR
entity_id     UUID nullable
old_value     JSONB nullable
new_value     JSONB nullable
ip_address    VARCHAR
user_agent    VARCHAR
created_at    TIMESTAMP  ← Aucun updated_at
```

### Table `refresh_tokens`
```
id          UUID, PK
user_id     FK → users
token_hash  VARCHAR UNIQUE
expires_at  TIMESTAMP
revoked     BOOLEAN DEFAULT false
created_at
```

---

## 6. MIDDLEWARES CRITIQUES

### `tenant.middleware.js` ← Le plus important pour le multi-tenant

Ce middleware s'exécute **après** `auth.middleware.js` sur toutes les routes protégées.

```javascript
// Comportement :
// Si req.user.user_type === 'client'
//   → Attacher req.tenantId = req.user.organization_id
//   → Toute requête DB sera automatiquement filtrée WHERE organization_id = req.tenantId
//   → Impossible pour un client d'accéder aux données d'une autre org (même en falsifiant les params)
//
// Si req.user.user_type === 'internal'
//   → req.tenantId = req.query.organizationId || null
//   → Si null : accès à toutes les organizations (vue globale backoffice)
//   → Si fourni : filtrage volontaire sur une org spécifique
```

Ce middleware doit être appliqué **dans les repositories**, pas dans les controllers :
```javascript
// Exemple dans ProjectRepository
async findAll(filters, tenantId) {
  const where = { ...filters };
  if (tenantId) where.organization_id = tenantId; // Isolation tenant
  return Project.findAll({ where });
}
```

### `role.middleware.js` — Matrice des permissions

```javascript
// Permissions par module et par rôle
const PERMISSIONS = {
  // Backoffice interne Golden Studio
  'projects.create':            ['super_admin', 'admin', 'contributor'],
  'projects.edit':              ['super_admin', 'admin', 'contributor'],
  'projects.delete':            ['super_admin', 'admin'],
  'projects.view_all_orgs':     ['super_admin', 'admin', 'validator', 'contributor', 'reader'],
  'proposals.create':           ['super_admin', 'admin', 'contributor'],
  'proposals.submit_to_client': ['super_admin', 'admin', 'validator'],
  'validations.internal':       ['super_admin', 'admin', 'validator'],
  'users.manage_internal':      ['super_admin'],
  'users.manage_clients':       ['super_admin', 'admin'],
  'organizations.manage':       ['super_admin'],
  'reporting.global':           ['super_admin', 'admin'],
  'audit.view':                 ['super_admin', 'admin'],
  'mediatheque.upload':         ['super_admin', 'admin', 'contributor'],

  // Portail client (toujours scoped à leur organization_id)
  'projects.view_own':          ['client_admin', 'client_validator', 'client_contributor', 'client_reader'],
  'briefs.submit':              ['client_admin', 'client_contributor'],
  'proposals.validate_client':  ['client_admin', 'client_validator'],
  'tasks.comment':              ['client_admin', 'client_validator', 'client_contributor'],
  'calendar.view':              ['client_admin', 'client_validator', 'client_contributor', 'client_reader'],
  'mediatheque.view':           ['client_admin', 'client_validator', 'client_contributor', 'client_reader'],
  'users.manage_own_org':       ['client_admin'],
  'reporting.own_org':          ['client_admin'],
};
```

### `audit.middleware.js`
- Logger automatiquement chaque mutation (POST/PUT/PATCH/DELETE) avec user_id, organization_id, action, entity
- Fire-and-forget asynchrone (ne bloque pas la réponse)

### `auth.middleware.js`
- Vérifier JWT, attacher `req.user` avec : id, email, user_type, role, organization_id

---

## 7. ROUTES API COMPLÈTES

Toutes les routes sont préfixées par `/api/v1`

### AUTH — `/api/v1/auth`
```
POST   /login                 → Login universel (internal + client), retourne tokens + user_type + role
POST   /logout                → Révoquer refresh token
POST   /refresh               → Renouveler access token
POST   /change-password       → Changer son mot de passe
POST   /2fa/enable            → Activer 2FA (génère secret TOTP + QR code URI)
POST   /2fa/verify            → Vérifier code TOTP au login (step 2)
POST   /2fa/disable           → Désactiver 2FA
GET    /me                    → Profil utilisateur connecté
```

### ORGANIZATIONS — `/api/v1/organizations` ← Accès: internal seulement
```
GET    /                      → Lister toutes les organisations (filtres: type, is_active, search)
POST   /                      → Créer une organisation (super_admin, admin)
GET    /:id                   → Détail d'une organisation + stats
PUT    /:id                   → Modifier
PATCH  /:id/status            → Activer / désactiver
GET    /:id/users             → Utilisateurs de cette organisation (côté client)
GET    /:id/projects          → Projets de cette organisation
GET    /:id/stats             → KPIs de cette organisation
```

### USERS — `/api/v1/users`
```
# Backoffice (internal only)
GET    /internal              → Lister les utilisateurs internes (super_admin, admin)
POST   /internal              → Créer un utilisateur interne (super_admin)
PATCH  /internal/:id/role     → Changer le rôle interne (super_admin)

# Gestion des utilisateurs clients
GET    /clients               → Lister tous les users clients (internal: admin+)
POST   /clients               → Créer un utilisateur client (internal: admin+ OU client_admin pour sa propre org)
PATCH  /clients/:id/role      → Changer rôle client (internal: admin+ OU client_admin pour sa propre org)

# Commun
GET    /:id                   → Détail utilisateur
PUT    /:id                   → Modifier profil
PATCH  /:id/status            → Activer / désactiver
DELETE /:id                   → Soft delete (is_active = false)
```

### PROJECTS — `/api/v1/projects`
```
# Vue adaptée selon user_type :
# - internal → voit tous les projets, peut filtrer par organizationId
# - client   → voit uniquement ses projets (filtrage automatique par tenant)

GET    /                      → Lister (filtres: status, priority, organizationId*, period, search, page)
POST   /                      → Créer un projet (internal: admin, contributor)
GET    /dashboard/stats       → Stats dashboard (adapté au user_type)
GET    /:id                   → Détail projet complet
PUT    /:id                   → Modifier projet (internal: admin, contributor)
PATCH  /:id/status            → Changer statut (internal seulement)
DELETE /:id                   → Archiver (internal: admin+)
```

### BRIEFS — `/api/v1/projects/:projectId/briefs`
```
# Un brief peut être soumis par un utilisateur client (client_contributor)
# ou créé par Golden Studio

GET    /                      → Récupérer le brief du projet
POST   /                      → Créer/soumettre le brief (internal: contributor+ | client: client_contributor+)
PUT    /:id                   → Modifier le brief (internal seulement après soumission client)
POST   /:id/attachments       → Uploader une pièce jointe (internal + client_contributor)
DELETE /:id/attachments/:attachId → Supprimer une pièce jointe
```

### TASKS — `/api/v1/tasks`
```
# visibility='internal_only' → invisibles aux utilisateurs client_*
# visibility='client_visible' → visibles aux deux parties

GET    /                      → Toutes les tâches (filtres: projectId, assignee, status, overdue, urgent, page)
                                 → internal: filtre optionnel par org | client: uniquement ses tâches visibles
POST   /                      → Créer une tâche (internal seulement)
GET    /:id                   → Détail tâche
PUT    /:id                   → Modifier (internal seulement)
PATCH  /:id/status            → Changer statut (internal seulement)
DELETE /:id                   → Supprimer (internal: admin+)

# Commentaires
GET    /:id/comments          → Commentaires (client voit uniquement les non-internes)
POST   /:id/comments          → Commenter (internal + client selon visibility de la tâche)
                                 → is_internal déduit automatiquement du user_type
DELETE /:id/comments/:cid     → Supprimer son propre commentaire
```

### PROPOSALS — `/api/v1/projects/:projectId/proposals`
```
# Propositions créées par Golden Studio, validées par le client

GET    /                      → Lister les propositions
                                 → internal: voit tout statuts (y compris 'draft')
                                 → client: voit uniquement 'pending_client_validation', 'approved', etc. (pas les drafts)
POST   /                      → Déposer une proposition (internal: contributor+)
GET    /:id                   → Détail proposition
PUT    /:id                   → Modifier (internal, seulement si status = 'draft')
PATCH  /:id/submit            → Soumettre au client (passe status → 'pending_client_validation') (internal: validator+)

# Commentaires
GET    /:id/comments          → Commentaires (client: uniquement non-internes)
POST   /:id/comments          → Commenter (internal + client_validator, client_contributor)

# Validation par le client
POST   /:id/validate          → Soumettre décision (client_validator, client_admin)
                                 Body: { status: 'approved'|'needs_revision'|'rejected', comments: '...' }
GET    /:id/validations        → Historique des validations
```

### PUBLICATIONS — `/api/v1/projects/:projectId/publications`
```
# Gérées par internal, visibles par le client

GET    /                      → Publications du projet
POST   /                      → Enregistrer une publication (internal: contributor+)
PUT    /:id                   → Modifier (internal)
DELETE /:id                   → Supprimer (internal: admin+)
```

### CALENDAR — `/api/v1/calendar`
```
# client voit uniquement les events 'client_visible' de son org

GET    /                      → Événements (filtres: month/week, type, projectId, organizationId*, status)
POST   /                      → Créer (internal: contributor+)
GET    /:id                   → Détail
PUT    /:id                   → Modifier (internal)
PATCH  /:id/status            → Changer statut (internal)
DELETE /:id                   → Supprimer (internal: admin+)
```

### MÉDIATHÈQUE — `/api/v1/media`
```
# Médias globaux (is_global=true) visibles par tous
# Médias d'une org visibles uniquement par cette org et les internal

GET    /                      → Lister (filtres: type, tags, search, is_global, organizationId*, page)
POST   /                      → Uploader (internal: contributor+)
GET    /:id                   → Détail + URL de téléchargement
PUT    /:id                   → Modifier métadonnées (internal)
DELETE /:id                   → Supprimer (internal: admin+)
GET    /:id/download          → Télécharger le fichier (internal + client selon org)
```

### REPORTING — `/api/v1/reporting`
```
# internal voit reporting global ou par org
# client voit uniquement reporting de sa propre org

GET    /overview              → KPIs globaux (internal) ou KPIs org (client)
GET    /projects              → Stats projets
GET    /users                 → Stats utilisateurs (internal: admin+ seulement)
GET    /publications          → Stats publications par canal, par période
GET    /validations           → Stats validations (délais moyens, taux d'approbation)
GET    /export/pdf            → Export PDF (via pdfkit)
GET    /export/excel          → Export Excel (via exceljs)
```

### AUDIT — `/api/v1/audit` ← Accès: internal admin+ seulement
```
GET    /                      → Journal (filtres: userId, organizationId, action, entityType, dateRange, page)
GET    /:id                   → Détail d'une entrée
```

---

## 8. FORMAT DE RÉPONSE API STANDARDISÉ

**Succès :**
```json
{
  "success": true,
  "data": { ... },
  "message": "Projet créé avec succès",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 154,
    "totalPages": 8
  }
}
```

**Erreur :**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED_ORG_ACCESS",
    "message": "Vous n'avez pas accès à cette organisation",
    "details": []
  }
}
```

**Codes d'erreur métier personnalisés :**
```
INVALID_CREDENTIALS           → Login échoué
TOKEN_EXPIRED                 → Access token expiré
INSUFFICIENT_ROLE             → Rôle insuffisant
UNAUTHORIZED_ORG_ACCESS       → Tentative d'accès à une autre org (client)
PROPOSAL_NOT_SUBMITTABLE      → Proposition pas dans le bon état pour être soumise
VALIDATION_ALREADY_EXISTS     → Validation déjà soumise pour cette proposition
RESOURCE_NOT_FOUND            → Entité non trouvée
VALIDATION_ERROR              → Erreur de validation Joi
```

---

## 9. DOCUMENTATION SWAGGER — EXIGENCES

- Accessible sur `/api-docs`
- **Deux serveurs documentés** : `http://localhost:3000` (dev) + URL production
- Authentification Bearer JWT configurée (bouton "Authorize")
- **Tags de regroupement** :
  - `Auth` — Authentification & 2FA
  - `Organizations` — Gestion des clients (backoffice)
  - `Users — Internal` — Utilisateurs Golden Studio
  - `Users — Clients` — Utilisateurs des institutions
  - `Projects` — Projets (backoffice + portail)
  - `Briefs` — Briefs et pièces jointes
  - `Tasks` — Tâches et commentaires
  - `Proposals` — Propositions & workflow de validation
  - `Publications` — Publications
  - `Calendar` — Calendrier éditorial
  - `Media Library` — Médiathèque
  - `Reporting` — KPIs & exports
  - `Audit` — Journal d'activité
- **Pour chaque route documenter** :
  - Description + qui peut l'appeler (internal/client, quel rôle)
  - Paramètres query/path/body avec types et exemples
  - Réponses : 200/201, 400, 401, 403, 404, 422, 500
  - Exemple de body request et response
- Schémas réutilisables dans `components/schemas` pour : User, Organization, Project, Task, Brief, Proposal, Validation, etc.

---

## 10. VARIABLES D'ENVIRONNEMENT

```env
# Server
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=govcom_db
DB_USER=govcom_user
DB_PASSWORD=your_password
DB_POOL_MAX=10

# JWT
JWT_ACCESS_SECRET=your_access_secret_min_32_chars_here
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# 2FA
TWO_FACTOR_APP_NAME=GovCom Platform

# Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174

# Logs
LOG_LEVEL=debug
LOG_DIR=./logs

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=5

# Swagger
SWAGGER_ENABLED=true
```

---

## 11. SEEDERS — DONNÉES DE TEST

Créer des seeders Sequelize pour :

**1. Organizations :**
- `Ministère de l'Industrie (MIPISE)` — type: ministry
- `Agence de Promotion des Investissements (API-ZF)` — type: agency

**2. Users internes (Golden Studio) :**
- 1 super_admin : `admin@goldenstudio.com` / `Admin@1234`
- 1 admin : `manager@goldenstudio.com`
- 1 validator : `validator@goldenstudio.com`
- 1 contributor : `creator@goldenstudio.com`

**3. Users clients :**
- Pour MIPISE : 1 client_admin, 1 client_validator, 1 client_reader
- Pour API-ZF : 1 client_admin, 1 client_contributor

**4. Projets de démonstration :**
- 3 projets pour MIPISE (statuts variés)
- 2 projets pour API-ZF
- Chaque projet avec brief, 2-3 tâches (mix visibility), 1-2 propositions dont une en attente de validation

**5. Médias globaux :**
- 3 entrées dans la médiathèque avec is_global=true (logos génériques)

---

## 12. RÈGLES DE QUALITÉ OBLIGATOIRES

1. `async/await` partout — jamais de callbacks
2. Controllers : uniquement lecture req/res + appel service + retour réponse. **Zéro logique métier**
3. Services : logique métier, validation métier, appel repository. **Zéro req/res**
4. Repositories : **uniquement** les appels Sequelize. Zéro logique métier
5. `tenant.middleware.js` injecte `req.tenantId` — les repositories l'utilisent systématiquement pour les users client
6. Aucun `console.log` — Winston uniquement
7. `bcrypt` rounds = 12
8. Pagination obligatoire sur tous les listings (default: 20, max: 100)
9. UUID pour tous les IDs
10. Soft delete sur Users, Projects, Organizations (is_active / status)
11. `audit_logs` : aucune route DELETE ni UPDATE, même pour super_admin
12. Les commentaires `is_internal=true` et les tâches `visibility='internal_only'` ne doivent **JAMAIS** apparaître dans les réponses aux utilisateurs `client_*`, même avec un ID direct

---

## 13. ORDRE D'IMPLÉMENTATION

**Étape 1 — Setup & Infrastructure**
- Init projet, packages, env, Winston, Express + middlewares globaux, Sequelize

**Étape 2 — Modèles & Migrations**
- Tous les modèles, associations, migrations dans l'ordre (organizations → users → projects → ...)

**Étape 3 — Auth complet**
- Login (internal + client), JWT, refresh, 2FA, change-password, `auth.middleware.js`

**Étape 4 — Tenant & Role middlewares**
- `tenant.middleware.js` (isolation multi-tenant)
- `role.middleware.js` (matrice de permissions)
- Tests unitaires sur ces deux middlewares

**Étape 5 — Organizations & Users**
- CRUD organisations (backoffice)
- CRUD users internal + users clients avec la logique de séparation

**Étape 6 — Modules métier (dans l'ordre)**
- Projects → Briefs → Tasks → Proposals + Validations → Publications → Calendar → Médiathèque

**Étape 7 — Reporting & Audit**
- KPIs, exports PDF/Excel, journal d'audit

**Étape 8 — Swagger & Documentation**
- Configuration complète, toutes les routes documentées

**Étape 9 — Seeders & Tests**
- Seeders de démonstration, tests d'intégration critiques
## RÈGLES DE SÉCURITÉ ET BONNES PRATIQUES

1. **Jamais de mot de passe en clair** — toujours bcrypt (rounds: 12)
2. **Jamais de données sensibles dans les logs** (passwords, tokens)
3. **Rate limiting** : 100 req/15min global, 5 req/15min sur les routes auth
4. **CORS** configuré via variable d'environnement (ALLOWED_ORIGINS)
5. **Helmet** activé sur toutes les routes
6. **Pagination** obligatoire sur toutes les routes de listing (default: 20 items/page, max: 100)
7. **Toutes les réponses API** dans un format standardisé :
   ```json
   {
     "success": true,
     "data": { ... },
     "message": "...",
     "meta": { "page": 1, "total": 50, "totalPages": 3 }
   }
   ```
   ou en cas d'erreur :
   ```json
   {
     "success": false,
     "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] }
   }
   ```
8. **UUID** pour tous les IDs primaires (pas d'auto-increment visible)
9. **Soft delete** préféré à la suppression physique sur les entités importantes
10. **Audit logs non supprimables** — aucune route DELETE sur audit_logs, même pour super_admin
---

## 14. LIVRABLE FINAL

```
✅ npm run dev       → Démarre sans erreur
✅ db:migrate        → Crée toutes les tables avec les bonnes contraintes
✅ db:seed:all       → Données de démo exploitables
✅ /api-docs         → Swagger UI avec toutes les routes documentées et testables
✅ Test login        → POST /api/v1/auth/login avec admin@goldenstudio.com fonctionne
✅ Test isolation    → Un user client ne peut PAS accéder aux projets d'une autre org
✅ Test permissions  → Un client_reader ne peut PAS soumettre de validation
✅ README.md         → Instructions de démarrage, architecture, users de test listés
```

---

> **Note Frontend :** Deux applications React distinctes consommeront ce backend :
> - **`govcom-backoffice`** → Dashboard Golden Studio (users internal)
> - **`govcom-portal`** → Portail clients/institutions (users client_*)
>
> La distinction se fait via le champ `user_type` retourné au login. Le token JWT est identique techniquement, mais les interfaces et les routes appelées diffèrent selon ce `user_type`.
