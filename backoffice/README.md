# GovCom Backoffice — Frontend Golden Studio

> Interface d'administration interne de la plateforme GovCom.
> Réservée aux utilisateurs **internal** (super_admin, admin, project_manager, collaborator).

## Stack Technique

| Technologie | Version | Rôle |
|---|---|---|
| React | 18.3 | UI Framework |
| Vite | 5.4 | Build tool & dev server |
| TailwindCSS | 3.4 | Styling (design system institutionnel) |
| React Router | 6 | Routing + lazy loading |
| Zustand | 5 | State management (auth) |
| Axios | 1.7 | HTTP client + JWT interceptors |
| Recharts | 2 | Charts (dashboard, reporting) |
| React Big Calendar | 1 | Module calendrier |
| Lucide React | 0.4 | Icônes minimalistes |
| React Hook Form + Zod | — | Formulaires + validation |
| date-fns | 4 | Formatage dates (locale FR) |
| react-hot-toast | 2 | Notifications toast |

## Démarrage

```bash
# Installer les dépendances
npm install

# Lancer en mode développement (port 5173)
npm run dev

# Build production
npm run build

# Aperçu du build
npm run preview
```

> Le backend doit tourner sur `http://localhost:3000`. Le proxy Vite redirige automatiquement `/api` vers le backend.

## Structure du Projet

```
src/
├── api/
│   ├── axios.js          # Instance Axios + JWT auto-refresh
│   └── services.js       # Services API par module
├── components/
│   ├── layout/
│   │   ├── MainLayout.jsx   # Sidebar + Header + Outlet
│   │   ├── Sidebar.jsx      # Navigation latérale fixe
│   │   └── Header.jsx       # Breadcrumb + notifications + user menu
│   └── ui/                  # 14 composants réutilisables
│       ├── Button.jsx       # Variants: primary/secondary/outline/ghost/danger
│       ├── Input.jsx        # Avec label, erreur, icône
│       ├── Textarea.jsx
│       ├── Select.jsx
│       ├── Badge.jsx        # 6 couleurs, taille, dot
│       ├── Card.jsx         # Conteneur avec titre/action
│       ├── Modal.jsx        # Backdrop blur, ESC close, animations
│       ├── Pagination.jsx   # Smart pages + ellipsis
│       ├── Avatar.jsx       # Image ou initiales
│       ├── LoadingScreen.jsx
│       ├── Skeleton.jsx     # + SkeletonText, SkeletonCard, SkeletonTable
│       ├── SearchInput.jsx  # Recherche avec clear
│       ├── Tabs.jsx         # Onglets avec count
│       ├── EmptyState.jsx   # État vide illustré
│       ├── ConfirmDialog.jsx
│       └── index.js         # Barrel export
├── hooks/
│   └── index.js          # useAsync, useDebounce, usePagination, useClickOutside
├── pages/
│   ├── auth/             # LoginPage, TwoFactorPage
│   ├── dashboard/        # DashboardPage (KPIs, charts, activité)
│   ├── organizations/    # Liste + Détail (onglets overview/users/projets)
│   ├── users/            # Liste internal/client, create modal
│   ├── projects/         # Liste + Détail (5 onglets: brief/tâches/propositions/validations/publications)
│   ├── tasks/            # Kanban + vue liste, filtres, create modal
│   ├── proposals/        # Workflow visuel, validation history, create modal
│   ├── calendar/         # react-big-calendar, événements color-coded
│   ├── media/            # Grid/liste, drag-drop upload, tags, preview
│   ├── reporting/        # KPIs + recharts + export PDF/Excel
│   ├── audit/            # Journal read-only, diff anciennes/nouvelles valeurs
│   ├── profile/          # Infos, mot de passe, 2FA
│   ├── settings/         # Notifications, apparence, admin settings
│   └── errors/           # 404, 403
├── routes/
│   └── ProtectedRoute.jsx  # Auth + user_type guard
├── store/
│   └── authStore.js      # Zustand persist (login, 2FA, refresh, me)
├── styles/
│   └── index.css         # Tailwind layers + calendar overrides
└── utils/
    └── helpers.js        # Dates, status maps, formatters
```

## Design System

- **Couleur primaire** : `#1E3A5F` (bleu institutionnel) — palette 50-950
- **Surfaces** : blanc `#FFFFFF`, gris très clair `#F8F9FA` à `#E5E7EB`
- **Texte** : noir profond `#111827` → gris `#6B7280`
- **Sémantique** : success (vert), warning (ambre), danger (rouge), info (bleu ciel)
- **Police** : Inter (Google Fonts)
- **Shadows** : card, card-hover, dropdown, modal, sidebar
- **Animations** : fade-in, slide-in, slide-up, pulse-soft

## Pages & Modules

| Module | Route | Description |
|---|---|---|
| Login | `/login` | Email/password + 2FA |
| Dashboard | `/dashboard` | KPIs, charts, activité récente |
| Organisations | `/organizations` | CRUD + détail onglets |
| Utilisateurs | `/users` | Internal + clients, rôles colorés |
| Projets | `/projects` | Liste + détail 5 onglets |
| Tâches | `/tasks` | Kanban + liste, filtres |
| Propositions | `/proposals` | Workflow, validations |
| Calendrier | `/calendar` | Mensuel/hebdo/jour |
| Médiathèque | `/media` | Grid/liste, upload, tags |
| Reporting | `/reporting` | Charts + export |
| Audit | `/audit` | Journal read-only |
| Profil | `/profile` | Infos, password, 2FA |
| Paramètres | `/settings` | Préférences, admin |

## Variables d'Environnement

Aucune requise en développement. Le proxy Vite gère la redirection vers le backend.

Pour la production, configurer `VITE_API_URL` si le backend est sur un domaine différent.
