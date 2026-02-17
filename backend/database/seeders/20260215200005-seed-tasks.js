'use strict';

const ORG_MIPISE = 'a1b2c3d4-0001-4000-8000-000000000001';
const ORG_APIZF  = 'a1b2c3d4-0002-4000-8000-000000000002';

const PROJECT_1 = 'd1b2c3d4-0001-4000-8000-000000000001';
const PROJECT_2 = 'd1b2c3d4-0002-4000-8000-000000000002';
const PROJECT_3 = 'd1b2c3d4-0003-4000-8000-000000000003';
const PROJECT_4 = 'd1b2c3d4-0004-4000-8000-000000000004';
const PROJECT_5 = 'd1b2c3d4-0005-4000-8000-000000000005';

const MANAGER     = 'b1b2c3d4-0002-4000-8000-000000000002';
const CONTRIBUTOR  = 'b1b2c3d4-0004-4000-8000-000000000004';
const ADMIN        = 'b1b2c3d4-0001-4000-8000-000000000001';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('tasks', [
      // --- PROJECT 1: Campagne Institutionnelle MIPISE (3 tasks) ---
      {
        id: 'f1b2c3d4-0001-4000-8000-000000000001',
        project_id: PROJECT_1,
        organization_id: ORG_MIPISE,
        title: 'Maquette identité visuelle campagne',
        description: 'Créer 3 propositions de direction artistique pour la campagne institutionnelle.',
        assigned_to: CONTRIBUTOR,
        due_date: '2025-04-01',
        status: 'in_production',
        priority: 'high',
        visibility: 'client_visible',
        created_by: MANAGER,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'f1b2c3d4-0002-4000-8000-000000000002',
        project_id: PROJECT_1,
        organization_id: ORG_MIPISE,
        title: 'Brief interne — Revue stratégique',
        description: 'Réunion interne pour valider la stratégie de communication avant présentation au client.',
        assigned_to: MANAGER,
        due_date: '2025-03-20',
        status: 'done',
        priority: 'normal',
        visibility: 'internal_only',
        created_by: ADMIN,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'f1b2c3d4-0003-4000-8000-000000000003',
        project_id: PROJECT_1,
        organization_id: ORG_MIPISE,
        title: 'Déclinaison supports digitaux',
        description: 'Adapter l\'identité visuelle validée aux formats web : bannières 728x90, 300x250, stories Instagram, header Facebook.',
        assigned_to: CONTRIBUTOR,
        due_date: '2025-05-15',
        status: 'todo',
        priority: 'normal',
        visibility: 'client_visible',
        created_by: MANAGER,
        created_at: now,
        updated_at: now,
      },

      // --- PROJECT 2: Refonte Site Web MIPISE (3 tasks) ---
      {
        id: 'f1b2c3d4-0004-4000-8000-000000000004',
        project_id: PROJECT_2,
        organization_id: ORG_MIPISE,
        title: 'Wireframes pages principales',
        description: 'Concevoir les wireframes pour : accueil, actualités, portail investisseur, annuaire, contact.',
        assigned_to: CONTRIBUTOR,
        due_date: '2025-03-01',
        status: 'done',
        priority: 'high',
        visibility: 'client_visible',
        created_by: MANAGER,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'f1b2c3d4-0005-4000-8000-000000000005',
        project_id: PROJECT_2,
        organization_id: ORG_MIPISE,
        title: 'Estimation budget hébergement',
        description: 'Préparer le devis interne pour l\'hébergement (serveurs, CDN, SSL) — ne pas partager avec le client.',
        assigned_to: ADMIN,
        due_date: '2025-02-28',
        status: 'done',
        priority: 'normal',
        visibility: 'internal_only',
        created_by: ADMIN,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'f1b2c3d4-0006-4000-8000-000000000006',
        project_id: PROJECT_2,
        organization_id: ORG_MIPISE,
        title: 'Design UI maquettes haute fidélité',
        description: 'Créer les maquettes finales en haute fidélité (Figma) basées sur les wireframes validés.',
        assigned_to: CONTRIBUTOR,
        due_date: '2025-03-25',
        status: 'in_production',
        priority: 'urgent',
        visibility: 'client_visible',
        created_by: MANAGER,
        created_at: now,
        updated_at: now,
      },

      // --- PROJECT 3: Rapport Annuel MIPISE (2 tasks) ---
      {
        id: 'f1b2c3d4-0007-4000-8000-000000000007',
        project_id: PROJECT_3,
        organization_id: ORG_MIPISE,
        title: 'Collecte données et chiffres clés 2024',
        description: 'Rassembler toutes les données statistiques du ministère pour l\'année 2024 auprès des directions.',
        assigned_to: MANAGER,
        due_date: '2025-02-15',
        status: 'todo',
        priority: 'high',
        visibility: 'client_visible',
        created_by: ADMIN,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'f1b2c3d4-0008-4000-8000-000000000008',
        project_id: PROJECT_3,
        organization_id: ORG_MIPISE,
        title: 'Négociation tarif impression offset',
        description: 'Comparer les devis de 3 imprimeurs pour le rapport annuel (500 exemplaires). Budget interne uniquement.',
        assigned_to: MANAGER,
        due_date: '2025-02-20',
        status: 'todo',
        priority: 'low',
        visibility: 'internal_only',
        created_by: ADMIN,
        created_at: now,
        updated_at: now,
      },

      // --- PROJECT 4: Brochure Zones Franches API-ZF (3 tasks) ---
      {
        id: 'f1b2c3d4-0009-4000-8000-000000000009',
        project_id: PROJECT_4,
        organization_id: ORG_APIZF,
        title: 'Rédaction contenu brochure (FR)',
        description: 'Rédiger le contenu français de la brochure : présentation zones franches, avantages fiscaux, procédures d\'installation.',
        assigned_to: CONTRIBUTOR,
        due_date: '2025-03-15',
        status: 'in_production',
        priority: 'high',
        visibility: 'client_visible',
        created_by: MANAGER,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'f1b2c3d4-0010-4000-8000-000000000010',
        project_id: PROJECT_4,
        organization_id: ORG_APIZF,
        title: 'Traduction contenu (AR + EN)',
        description: 'Traduction professionnelle du contenu vers l\'arabe et l\'anglais. Coordination avec le prestataire externe.',
        assigned_to: MANAGER,
        due_date: '2025-04-01',
        status: 'todo',
        priority: 'normal',
        visibility: 'client_visible',
        created_by: MANAGER,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'f1b2c3d4-0011-4000-8000-000000000011',
        project_id: PROJECT_4,
        organization_id: ORG_APIZF,
        title: 'Sélection photographe — shooting terrain',
        description: 'Choisir le photographe pour le reportage terrain dans les zones franches. Budget à valider en interne.',
        assigned_to: ADMIN,
        due_date: '2025-03-10',
        status: 'blocked',
        priority: 'normal',
        visibility: 'internal_only',
        created_by: ADMIN,
        created_at: now,
        updated_at: now,
      },

      // --- PROJECT 5: Vidéo Promotionnelle API-ZF (2 tasks) ---
      {
        id: 'f1b2c3d4-0012-4000-8000-000000000012',
        project_id: PROJECT_5,
        organization_id: ORG_APIZF,
        title: 'Storyboard vidéo motion design',
        description: 'Créer le storyboard complet de la vidéo avec script voix-off et découpage séquences.',
        assigned_to: CONTRIBUTOR,
        due_date: '2025-01-25',
        status: 'done',
        priority: 'high',
        visibility: 'client_visible',
        created_by: MANAGER,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'f1b2c3d4-0013-4000-8000-000000000013',
        project_id: PROJECT_5,
        organization_id: ORG_APIZF,
        title: 'Sous-titrage et finalisation export',
        description: 'Ajouter les sous-titres arabe/français/anglais et exporter en 1080p + 4K.',
        assigned_to: CONTRIBUTOR,
        due_date: '2025-02-20',
        status: 'done',
        priority: 'normal',
        visibility: 'client_visible',
        created_by: MANAGER,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('tasks', {
      id: [
        'f1b2c3d4-0001-4000-8000-000000000001',
        'f1b2c3d4-0002-4000-8000-000000000002',
        'f1b2c3d4-0003-4000-8000-000000000003',
        'f1b2c3d4-0004-4000-8000-000000000004',
        'f1b2c3d4-0005-4000-8000-000000000005',
        'f1b2c3d4-0006-4000-8000-000000000006',
        'f1b2c3d4-0007-4000-8000-000000000007',
        'f1b2c3d4-0008-4000-8000-000000000008',
        'f1b2c3d4-0009-4000-8000-000000000009',
        'f1b2c3d4-0010-4000-8000-000000000010',
        'f1b2c3d4-0011-4000-8000-000000000011',
        'f1b2c3d4-0012-4000-8000-000000000012',
        'f1b2c3d4-0013-4000-8000-000000000013',
      ],
    });
  },
};
