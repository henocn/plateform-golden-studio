# Cahier des charges

**Plateforme de Gouvernance et de Suivi de Communication Institutionnelle**

Version 1.0

## I. Contexte et objectif

### 1.1 Contexte

Dans le cadre de la gestion centralisée de la communication du Ministère de l’Industrie, de la
Promotion des Investissements et de la Souveraineté Économique ainsi que de ses agences
rattachées (ex : Agence de Promotion des Investissements et de la Zone Franche), il est
nécessaire de disposer d’une plateforme numérique dédiée permettant :

- La centralisation des briefs
- Le suivi des projets
- La traçabilité des validations
- L’archivage des contenus
- Le pilotage en temps réel

### 1.2 Objectifs

La plateforme devra :

- Offrir une visibilité claire sur tous les projets en cours
- Permettre le suivi détaillé de chaque tâche
- Centraliser les échanges et validations
- Éviter les pertes d’information
- Structurer la gouvernance de la communication ministérielle

## II. Principes directeurs

1. Simplicité visuelle
2. Zéro superflu
3. Navigation intuitive
4. Transparence totale
5. Traçabilité complète
6. Performance et sécurité
7. Hiérarchisation claire des droits d’accès

## III. Architecture fonctionnelle globale

La plateforme sera structurée en 8 modules principaux :

### Module 1 – Dashboard central

**Objectif :** Vue synthétique en temps réel.

**Affichages :**

- Nombre total de projets en cours
- Projets en attente validation
- Projets urgents
- Publications programmées
- Projets terminés
- KPI globaux (optionnel)

**Filtres dynamiques :**

- Par agence
- Par direction
- Par statut
- Par priorité
- Par période

### Module 2 – Gestion des projets

**Chaque projet doit contenir :**

**Fiche projet :**

- Titre
- Agence / Direction concernée
- Responsable interne
- Responsable studio
- Date de création
- Date cible
- Niveau de priorité
- Statut (Brief reçu / En production / En validation / Publié / Archivé)

**Sous-sections obligatoires du projet :**

1. **Brief initial**
	- Description complète
	- Objectif
	- Cible
	- Message clé
	- Deadline
	- Documents joints
2. **Tâches détaillées**
	- Sous forme :
	  - Liste
	  - Vue Kanban
	  - Vue chronologique
	- Chaque tâche doit inclure :
	  - Nom
	  - Assignation
	  - Date limite
	  - Statut
	  - Commentaires
	  - Historique modifications
3. **Propositions déposées**
	- Version 1
	- Version 2
	- Version finale
	- Chaque version doit :
	  - Être horodatée
	  - Avoir un espace commentaire structuré
	  - Indiquer auteur
	  - Indiquer validateur
4. **Historique de validation**
	- Date
	- Nom validateur
	- Commentaires
	- Statut (Validé / À modifier / Refusé)
5. **Statut publication**
	- Date publication
	- Canal (Facebook, LinkedIn, communiqué officiel, etc.)
	- Lien publication
	- Capture ou archive

### Module 3 – Gestion des tâches globales

Vue transversale permettant :

- Voir toutes les tâches de tous les projets
- Voir les retards
- Voir les urgences
- Filtrer par collaborateur

**But :** pilotage opérationnel.

### Module 4 – Calendrier éditorial

Vue calendrier mensuelle / hebdomadaire :

- Publications prévues
- Événements à couvrir
- Tournages prévus
- Dépôts de livrables

**Couleurs selon :**

- En attente
- Validé
- Programmé
- Publié

### Module 5 – Médiathèque intelligente

**Centralisation :**

- Logos officiels
- Chartes graphiques
- Vidéos officielles
- Photos validées
- Templates

**Avec :**

- Système de tags
- Moteur de recherche
- Classement par agence

### Module 6 – Reporting & KPI

**Indicateurs intégrables :**

- Nombre de publications
- Taux d’engagement
- Portée
- Couverture événementielle
- Temps moyen validation

**Export possible :**

- PDF
- Excel

### Module 7 – Gestion des utilisateurs

**Rôles :**

- Super Admin
- Administrateur
- Validateur
- Contributeur
- Lecteur seul

**Capacités paramétrables :**

- Création projet
- Modification
- Validation
- Publication
- Accès statistiques
- Téléchargement

### Module 8 – Traçabilité & sécurité

- Historique complet actions
- Horodatage automatique
- Sauvegarde automatique
- Niveau sécurité élevé
- Double authentification
- Journal d’activité

## IV. UX / UI – Expérience utilisateur

**Style visuel :**

- Fond blanc ou gris très clair
- Noir profond pour titres
- Accent bleu institutionnel
- Icônes simples, minimalistes
- Espaces aérés
- Pas d’éléments décoratifs inutiles

**Navigation :**

Menu latéral fixe :

- Dashboard
- Projets
- Tâches
- Calendrier
- Médiathèque
- Reporting
- Utilisateurs
- Paramètres

**Objectif UX :**

En 3 clics maximum → atteindre n’importe quelle information.

## V. Aspect technique

**Architecture recommandée :**

- Web application
- Responsive (desktop prioritaire)
- Cloud sécurisé
- Base de données relationnelle

**Stack possible :**

- Frontend : React ou Vue
- Backend : Node.js / Django
- Base : PostgreSQL
- Auth : JWT + 2FA
- Hébergement : serveur sécurisé (idéalement local + backup cloud)

## VI. Évolutions futures (Phase 2)

- Intelligence artificielle pour analyse KPI
- Suggestion éditoriale
- Automatisation planning
- API réseaux sociaux
- Signature électronique intégrée

## VII. Spécificités institutionnelles importantes

- Tout contenu doit pouvoir être archivé officiellement
- Validation formelle indispensable
- Historique non supprimable
- Possibilité d’audit externe