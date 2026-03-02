# Formats Excel d'import calendrier

Ce document décrit les formats Excel acceptés pour :

- le **calendrier éditorial** (`/api/v1/calendar/editorial/import`)
- le **calendrier des événements** (`/api/v1/calendar/events/import`)

> Fichier attendu : `.xlsx` avec **une seule feuille**, en-têtes sur la **première ligne**.

---

## 1) Import calendrier éditorial (publications)

### Colonnes attendues (ordre exact)

| Colonne | En-tête Excel | Obligatoire | Description |
|---------|--------------|-------------|-------------|
| A | **Titre** | Oui | Le titre de la publication |
| B | **Date de publication** | Oui | La date prévue (ex : `15/03/2026`) |
| C | **Notes** | Non | Texte libre (description, contexte, remarques) |

### Détails de remplissage

- **Titre** : texte libre décrivant la publication (ex : "Communiqué bilan annuel 2025")
- **Date de publication** : format date Excel classique (ex : `15/03/2026`)
- **Notes** : toute information complémentaire utile

### Comportement automatique

- Le **statut** est automatiquement mis à **"Planifié"** pour chaque publication importée.
- Le **publicateur** est automatiquement défini comme l'utilisateur connecté qui lance l'import.
- Les **réseaux sociaux** et **liens** pourront être ajoutés après l'import, lors de l'assignation d'une tâche.

### Exemple de fichier

| Titre | Date de publication | Notes |
|-------|-------------------|-------|
| Communiqué bilan annuel 2025 | 15/03/2026 | Publication du compte-rendu de la campagne annuelle |
| Annonce nouveau programme | 22/03/2026 | Lancement officiel du programme jeunesse |
| Point presse trimestriel | 01/04/2026 | Conférence de presse Q1 |

---

## 2) Import calendrier des événements

### Colonnes attendues (ordre exact)

| Colonne | En-tête Excel | Obligatoire | Description |
|---------|--------------|-------------|-------------|
| A | **Titre** | Oui | Le nom de l'événement |
| B | **Type** | Oui | Le type d'événement (voir valeurs acceptées) |
| C | **Date début** | Oui | La date de début |
| D | **Date fin** | Non | La date de fin (si différente de la date de début) |
| E | **Statut** | Non | L'état de l'événement (par défaut : "En attente") |
| F | **Visibilité** | Non | Qui peut voir l'événement (par défaut : "Visible client") |
| G | **Description** | Non | Texte libre de description |

### Valeurs acceptées

**Type** (colonne B) :
| Valeur à écrire | Signification |
|-----------------|---------------|
| Événement | Couverture d'événement |
| Réunion | Réunion interne ou externe |
| Autre | Tout autre type |

**Statut** (colonne E) :
| Valeur à écrire | Signification |
|-----------------|---------------|
| En attente | Non encore validé (valeur par défaut) |
| Validé | Approuvé et confirmé |
| Planifié | Programmé dans le calendrier |
| Publié | Rendu public |
| Annulé | Événement annulé |

**Visibilité** (colonne F) :
| Valeur à écrire | Signification |
|-----------------|---------------|
| Interne | Visible uniquement par l'équipe interne |
| Visible client | Visible par le client (valeur par défaut) |

### Exemple de fichier

| Titre | Type | Date début | Date fin | Statut | Visibilité | Description |
|-------|------|-----------|----------|--------|------------|-------------|
| Réunion de coordination | Réunion | 10/03/2026 | 10/03/2026 | Planifié | Visible client | Point hebdomadaire de l'équipe |
| Conférence de presse | Événement | 15/03/2026 | 15/03/2026 | En attente | Visible client | Présentation des résultats annuels |
| Revue interne du projet | Réunion | 20/03/2026 | 20/03/2026 | Validé | Interne | Bilan d'avancement interne |

---

## Conseils pratiques

- Les dates peuvent être au **format date Excel** classique (ex : `15/03/2026`).
- Évitez les **lignes vides** au milieu du fichier.
- Utilisez l'encodage **UTF-8** pour les accents.
- En cas d'erreur, l'API retourne le nombre de lignes importées et le nombre de lignes ignorées.
- Les colonnes supplémentaires au-delà de celles listées sont ignorées.
