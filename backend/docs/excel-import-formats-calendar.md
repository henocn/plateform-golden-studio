# Formats Excel d'import calendrier

Ce document décrit les formats Excel acceptés pour :

- le **calendrier éditorial** (`/api/v1/calendar/editorial/import`)
- le **calendrier des événements** (`/api/v1/calendar/events/import`)

> Fichier attendu : `.xlsx` (ou `.xls`) avec **une seule feuille**, en-têtes sur la **première ligne**.

---

## 1) Import calendrier éditorial

### Colonnes attendues (ordre exact)

1. `date_publication`
2. `tache_id`
3. `reseaux`
4. `liens_reseaux`
5. `statut`
6. `notes`
7. `projet_id`

### Détails de remplissage

- `date_publication` : date Excel ou texte ISO (`2026-03-15`)
- `tache_id` : UUID de tâche (optionnel mais recommandé)
- `reseaux` : liste séparée par virgule  
  Ex: `facebook,linkedin,instagram`
- `liens_reseaux` : couples `reseau=url` séparés par virgule  
  Ex: `facebook=https://fb.com/post/1,linkedin=https://linkedin.com/posts/abc`
- `statut` : `scheduled` | `published` | `draft` | `archived`
- `notes` : texte libre (description de publication)
- `projet_id` : UUID projet (optionnel)

### Important

- **Le publicateur n'est pas importé** : il est automatiquement défini à l'utilisateur connecté qui lance l'import.
- Si `tache_id` est vide, l'entrée peut quand même être importée (puis tâche assignable après import).
- Les colonnes non listées sont ignorées.

### Exemple de ligne

| date_publication | tache_id | reseaux | liens_reseaux | statut | notes | projet_id |
|---|---|---|---|---|---|---|
| 2026-03-15 | a1b2c3d4-1111-4000-8000-000000000123 | facebook,linkedin | facebook=https://fb.com/p/123,linkedin=https://lnkd.in/abc | scheduled | Publication du compte-rendu campagne | a1b2c3d4-0001-4000-8000-000000000001 |

---

## 2) Import calendrier des événements

### Colonnes attendues (ordre exact)

1. `titre`
2. `type`
3. `date_debut`
4. `date_fin`
5. `statut`
6. `visibilite`
7. `description`
8. `projet_id`

### Détails de remplissage

- `titre` : obligatoire
- `type` : **3 types supportés**  
  - `evenement` (ou `event_coverage`)
  - `reunion` (ou `meeting`)
  - `autre` (ou `other`)
- `date_debut` : obligatoire
- `date_fin` : optionnelle
- `statut` : `pending` | `validated` | `scheduled` | `published` | `cancelled`
- `visibilite` : `internal_only` | `client_visible`
- `description` : texte libre
- `projet_id` : UUID projet (optionnel)

### Exemple de ligne

| titre | type | date_debut | date_fin | statut | visibilite | description | projet_id |
|---|---|---|---|---|---|---|---|
| Réunion coordination | reunion | 2026-03-10 | 2026-03-10 | scheduled | client_visible | Point hebdo équipe | a1b2c3d4-0001-4000-8000-000000000001 |

---

## Conseils pratiques

- Garder les UUID exacts (tâches/projets).
- Éviter les lignes vides au milieu.
- Utiliser UTF-8 pour les accents.
- En cas d'erreur, l'API retourne le nombre importé et ignoré.

