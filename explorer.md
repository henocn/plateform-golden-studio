# Architecture pour une médiathèque multi-organisation avec dossiers et fichiers

## Objectif
Permettre à chaque organisation d'avoir son propre dossier racine dans la médiathèque, avec gestion de sous-dossiers et fichiers, droits d'accès, et hiérarchie.

---

## 1. Modèle principal : Media
- Représente un fichier (document, image, vidéo, etc.)
- Stocke les métadonnées du fichier
- Associé à une organisation (optionnel)
- Peut être global (is_global)

## 2. Modèle à ajouter : Folder
- Représente un dossier (peut être racine ou sous-dossier)
- Attributs :
  - id (UUID)
  - name (nom du dossier)
  - parent_id (UUID, nullable, référence vers un autre dossier)
  - organization_id (UUID, nullable, référence vers l'organisation propriétaire)
  - is_global (booléen, pour les dossiers globaux)
  - created_by (UUID, utilisateur ayant créé le dossier)
  - timestamps
- Relations :
  - Un dossier peut avoir plusieurs sous-dossiers (self-relation)
  - Un dossier peut contenir plusieurs fichiers (relation avec Media)

## 3. Hiérarchie
- Racine : chaque organisation a un dossier racine (créé par admin/super admin)
- Sous-dossiers : chaque dossier peut avoir des sous-dossiers (arborescence illimitée)
- Fichiers : chaque dossier peut contenir des fichiers (Media)

## 4. Droits d'accès
- Admin/Super admin : peut créer/modifier/supprimer n'importe quel dossier ou fichier
- Organisation : ne voit que son propre dossier racine et ses sous-dossiers/fichiers
- Utilisateurs : droits selon rôle (lecture, écriture, suppression)

## 5. Navigation
- Vue "explorateur" :
  - Affiche les dossiers accessibles
  - Affiche les sous-dossiers et fichiers d'un dossier sélectionné
  - Permet la création de sous-dossiers et l'ajout de fichiers

## 6. Exemple de structure
```
Médiathèque
├── Organisation A
│   ├── Dossier Racine (orgA)
│   │   ├── Sous-dossier 1
│   │   │   ├── Fichier 1
│   │   │   └── Fichier 2
│   │   └── Sous-dossier 2
│   │       └── Fichier 3
├── Organisation B
│   ├── Dossier Racine (orgB)
│   │   └── Fichier 4
└── Global
    ├── Dossier Global
    │   └── Fichier 5
```

## 7. Modèles à prévoir
- Folder (dossier)
- Media (fichier)
- User (pour droits)
- Organization

## 8. Points techniques
- Utiliser une relation parent_id pour la hiérarchie des dossiers
- Stocker l'organisation propriétaire sur chaque dossier et fichier
- Gérer les droits d'accès côté backend et frontend
- Prévoir une API pour explorer, créer, déplacer, supprimer dossiers/fichiers

## 9. Avantages
- Structure flexible et scalable
- Gestion fine des droits
- Navigation intuitive
- Adapté à un usage multi-organisation

---

**Cette architecture permet de répondre à tous les besoins de hiérarchie, droits, et navigation pour une médiathèque multi-organisation.**
