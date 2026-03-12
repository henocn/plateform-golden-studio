// Règles communes (gérées dans emailTemplates.js)
// - Logo Qidoo en haut (Qidoo white / Quido black selon le fond)
// - Bandeau de titre simple (fond blanc, bordure inférieure grise légère, pas de dégradé)
// - Bouton d’action : fond blanc, bordure fine primaire, texte primaire
// - Pied de page : “Équipe Qidoo – goldenstudioeatech@gmail.com” + lien FRONTEND_URL

// ===================================================================
// 1. Notification : tâches d’événement assignées
// ===================================================================
// Sujet :
//   Tâches d’événement assignées — [Nom de l’événement]
//
// Corps :
//   Bonjour [Prénom] [Nom],
//
//   Dans le cadre de l’événement « [Nom de l’événement] », vous avez été
//   assigné à [X] tâche(s).
//
//   Détail des tâches :
//   - [Titre de la tâche 1] – date cible : [JJ/MM/AAAA]
//   - [Titre de la tâche 2] – date cible : [JJ/MM/AAAA]
//   - ...
//
//   Merci de préparer vos propositions et livrables avant les dates cibles indiquées.
//
//   Consulter l’événement dans la plateforme :
//   [Lien vers l’événement – FRONTEND_URL + /calendar/events]

// ===================================================================
// 2. Notification : rappel de deadline de tâche
// ===================================================================
// Sujet :
//   Rappel de deadline — [Titre de la tâche]
//
// Corps :
//   Bonjour [Prénom] [Nom],
//
//   Ceci est un rappel concernant la tâche « [Titre de la tâche] »
//   dont la date limite est fixée au [Date limite].
//   Il vous reste [Nombre de jours restants] jour(s) pour la finaliser.
//
//   Merci de prendre les dispositions nécessaires afin de respecter cette échéance.
//
//   Consulter la tâche dans la plateforme :
//   [Lien vers la tâche – FRONTEND_URL + /tasks/[id]]

// ===================================================================
// 3. Notification : proposition de tâche à valider
// ===================================================================
// Sujet :
//   Validation de proposition de tâche — [Titre de la tâche]
//
// Corps :
//   Bonjour [Prénom] [Nom],
//
//   Vous avez une proposition de tâche à valider : « [Titre de la tâche] ».
//   Cette proposition a été envoyée par [Prénom auteur] [Nom auteur] le [Date d’envoi].
//
//   Merci de la consulter et de la valider, refuser ou demander une révision.
//
//   Accéder à la proposition :
//   [Lien vers la proposition – FRONTEND_URL + /projects/[projectId]/proposals/[proposalId]]

// ===================================================================
// 4. Notification : résultat de validation de proposition
// ===================================================================
// Sujet :
//   Statut de votre proposition — [Titre de la tâche]
//
// Corps :
//   Bonjour [Prénom] [Nom],
//
//   Votre proposition pour la tâche « [Titre de la tâche] » a été
//   [acceptée / refusée / marquée “à réviser”].
//
//   Commentaire du validateur (en gras) :
//   [Commentaire du validateur]
//
//   Cette proposition a été traitée par [Prénom validateur] [Nom validateur]
//   le [Date de validation].
//
//   Voir la proposition dans la plateforme :
//   [Lien vers la proposition – FRONTEND_URL + /projects/[projectId]/proposals/[proposalId]]

// ===================================================================
// 5. Notification : rappel de publication éditoriale
// ===================================================================
// Sujet :
//   Rappel de publication — [Titre de la publication]
//
// Corps :
//   Bonjour [Prénom] [Nom],
//
//   La publication « [Titre de la publication] » est prévue pour le [Date de publication].
//   Il reste [Nombre de jours restants] jour(s) avant cette date.
//
//   Ceci est un rappel automatique : merci de vous assurer que tout est prêt
//   pour la diffusion à la date prévue.
//
//   Consulter la publication dans la plateforme :
//   [Lien – FRONTEND_URL + /calendar/editorial]
