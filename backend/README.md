# GovCom Platform — Backend API

> **Plateforme B2B Multi-tenant** — Golden Studio × Institutions Clientes  
> Node.js · Express 5 · PostgreSQL 16 · Sequelize 6 · JWT · 2FA TOTP

---

## Démarrage rapide

### Prérequis

- **Node.js** >= 18 (testé avec 24.x)
- **PostgreSQL** >= 14
- **npm** >= 9

### Installation

```bash
cd backend
npm install
```

### Configuration

Copier `.env.example` → `.env` et adapter les valeurs :

```bash
cp .env.example .env
```

Variables essentielles :

| Variable | Description | Défaut |
|---|---|---|
| `DB_HOST` | Hôte PostgreSQL | `localhost` |
| `DB_PORT` | Port PostgreSQL | `5432` |
| `DB_NAME` | Nom base de données | `govcom_db` |
| `DB_USER` | Utilisateur PostgreSQL | `postgres` |
| `DB_PASSWORD` | Mot de passe PostgreSQL | — |
| `JWT_ACCESS_SECRET` | Clé secrète JWT access (min 32 chars) | — |
| `JWT_REFRESH_SECRET` | Clé secrète JWT refresh (min 32 chars) | — |
| `PORT` | Port du serveur | `3000` |

### Base de données

```bash
# Créer la base
createdb govcom_db

# Exécuter les migrations
npm run db:migrate

# Peupler avec les données de démonstration
npm run db:seed:all
```

### Lancer le serveur

```bash
# Développement (avec hot-reload)
npm run dev

# Production
npm start
```

Le serveur démarre sur `http://localhost:3000`.  
Documentation Swagger : `http://localhost:3000/api/v1/api-docs`

---

## Architecture

```
backend/
├── server.js                   # Point d'entrée
├── src/
│   ├── app.js                  # Configuration Express
│   ├── config/
│   │   ├── database.js         # Configuration Sequelize
│   │   ├── env.js              # Validation env (envalid)
│   │   └── swagger.js          # Configuration Swagger
│   ├── middlewares/
│   │   ├── auth.middleware.js       # JWT verification
│   │   ├── tenant.middleware.js     # Multi-tenant isolation
│   │   ├── role.middleware.js       # RBAC permissions
│   │   ├── validate.middleware.js   # Joi validation
│   │   ├── audit.middleware.js      # Audit logging
│   │   ├── upload.middleware.js     # Multer file uploads
│   │   └── errorHandler.middleware.js
│   ├── models/                 # Sequelize models + associations
│   ├── modules/
│   │   ├── auth/               # Authentification + 2FA
│   │   ├── organizations/      # Gestion organisations
│   │   ├── users/              # Users internes + clients
│   │   ├── projects/           # Projets
│   │   ├── briefs/             # Briefs + pièces jointes
│   │   ├── tasks/              # Tâches + commentaires
│   │   ├── proposals/          # Propositions + validations
│   │   ├── publications/       # Publications
│   │   ├── calendar/           # Événements calendrier
│   │   ├── media/              # Médiathèque
│   │   ├── reporting/          # Reporting + exports PDF/Excel
│   │   └── audit/              # Journal d'audit
│   └── utils/
│       ├── ApiError.js         # Erreurs métier
│       ├── ApiResponse.js      # Réponses standardisées
│       ├── pagination.js       # Helpers pagination
│       └── logger.js           # Winston logger
├── database/
│   ├── migrations/             # Migrations Sequelize
│   └── seeders/                # Seeders données démo
├── tests/
│   ├── unit/                   # Tests unitaires
│   └── integration/            # Tests d'intégration
└── uploads/                    # Fichiers uploadés
```

Chaque module suit le pattern **Repository → Service → Controller → Routes → Swagger**.

---

## Multi-tenant

L'isolation des données est gérée par le `tenant.middleware.js` :

- **Utilisateur client** → `req.tenantId` = son `organization_id` (forcé, immuable)
- **Utilisateur interne** → `req.tenantId` = `req.query.organizationId` (optionnel, filtre volontaire)

Les clients ne voient **jamais** les données d'autres organisations.

---

## Rôles & Permissions

### Utilisateurs internes (Golden Studio)

| Rôle | Droits |
|---|---|
| `super_admin` | Accès total, gestion organisations & users |
| `admin` | Gestion projets, users clients, reporting |
| `validator` | Validation interne, soumission aux clients |
| `contributor` | Création projets, tâches, propositions |
| `reader` | Lecture seule |

### Utilisateurs clients (Institutions)

| Rôle | Droits |
|---|---|
| `client_admin` | Admin de son org, validation, reporting |
| `client_validator` | Validation propositions |
| `client_contributor` | Briefs, commentaires |
| `client_reader` | Lecture seule |

---

## Comptes de test (seeders)

### Internes

| Email | Mot de passe | Rôle |
|---|---|---|
| `admin@goldenstudio.com` | `Admin@1234` | super_admin |
| `manager@goldenstudio.com` | `Manager@1234` | admin |
| `validator@goldenstudio.com` | `Validator@1234` | validator |
| `creator@goldenstudio.com` | `Creator@1234` | contributor |

### Clients — MIPISE

| Email | Mot de passe | Rôle |
|---|---|---|
| `admin@mipise.gov.dz` | `Client@1234` | client_admin |
| `validateur@mipise.gov.dz` | `Client@1234` | client_validator |
| `lecteur@mipise.gov.dz` | `Client@1234` | client_reader |

### Clients — API-ZF

| Email | Mot de passe | Rôle |
|---|---|---|
| `admin@api-zf.gov.dz` | `Client@1234` | client_admin |
| `contributeur@api-zf.gov.dz` | `Client@1234` | client_contributor |

---

## Endpoints principaux

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Connexion (email/password) |
| `POST` | `/api/v1/auth/refresh` | Rafraîchir tokens |
| `GET` | `/api/v1/auth/me` | Profil utilisateur courant |
| `GET` | `/api/v1/organizations` | Lister organisations |
| `GET` | `/api/v1/users/internal` | Lister utilisateurs internes |
| `GET` | `/api/v1/users/clients` | Lister utilisateurs clients |
| `GET` | `/api/v1/projects` | Lister projets |
| `POST` | `/api/v1/projects` | Créer un projet |
| `GET` | `/api/v1/projects/:id/briefs` | Briefs d'un projet |
| `GET` | `/api/v1/projects/:id/proposals` | Propositions d'un projet |
| `POST` | `/api/v1/projects/:id/proposals/:pid/validate` | Valider proposition |
| `GET` | `/api/v1/tasks` | Lister tâches |
| `GET` | `/api/v1/calendar` | Événements calendrier |
| `GET` | `/api/v1/media` | Médiathèque |
| `GET` | `/api/v1/reporting/overview` | Dashboard KPIs |
| `GET` | `/api/v1/audit` | Journal d'audit |

Documentation complète : **Swagger** sur `/api/v1/api-docs`

---

## Tests

```bash
# Tous les tests
npm test

# Tests unitaires uniquement
npx jest tests/unit

# Tests d'intégration uniquement
npx jest tests/integration

# Un fichier spécifique
npx jest tests/integration/auth.test.js --verbose
```

### Couverture

- **58 tests unitaires** : ApiError, pagination, tenant middleware, role middleware
- **43 tests d'intégration** : auth flows, multi-tenant isolation, permissions RBAC, workflow propositions

---

## Format des réponses

### Succès

```json
{
  "success": true,
  "data": { ... },
  "message": "Success",
  "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
```

### Erreur

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Unauthorized",
    "details": []
  }
}
```

---

## Scripts npm

| Script | Commande |
|---|---|
| `npm run dev` | Développement (nodemon) |
| `npm start` | Production |
| `npm test` | Lancer tous les tests |
| `npm run db:migrate` | Exécuter les migrations |
| `npm run db:migrate:undo` | Rollback des migrations |
| `npm run db:seed:all` | Peupler la base avec les seeders |

---

## Licence

ISC — Golden Studio
