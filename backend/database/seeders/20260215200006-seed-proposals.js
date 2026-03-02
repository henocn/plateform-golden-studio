'use strict';

const PROJECT_1 = 'd1b2c3d4-0001-4000-8000-000000000001';
const PROJECT_2 = 'd1b2c3d4-0002-4000-8000-000000000002';
const PROJECT_3 = 'd1b2c3d4-0003-4000-8000-000000000003';
const PROJECT_4 = 'd1b2c3d4-0004-4000-8000-000000000004';
const PROJECT_5 = 'd1b2c3d4-0005-4000-8000-000000000005';

const CONTRIBUTOR = 'b1b2c3d4-0004-4000-8000-000000000004';
const VALIDATOR   = 'b1b2c3d4-0003-4000-8000-000000000003';
const MANAGER     = 'b1b2c3d4-0002-4000-8000-000000000002';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('proposals', [
      // --- PROJECT 1: Campagne Institutionnelle MIPISE ---
      {
        id: 'a7b2c3d4-0001-4000-8000-000000000001',
        project_id: PROJECT_1,
        version_number: 1,
        title: 'Direction artistique campagne — V1',
        description: 'Première proposition de direction artistique. Palette bleu/or, typographie institutionnelle, iconographie minimaliste.',
        file_path: null,
        author_id: CONTRIBUTOR,
        validator_id: VALIDATOR,
        status: 'needs_revision',
        submitted_at: new Date('2025-03-10T14:00:00Z'),
        created_at: now,
        updated_at: now,
      },
      {
        id: 'a7b2c3d4-0002-4000-8000-000000000002',
        project_id: PROJECT_1,
        version_number: 2,
        title: 'Direction artistique campagne — V2',
        description: 'Deuxième proposition intégrant les retours client. Palette bleu/blanc, illustrations vectorielles, style épuré.',
        file_path: null,
        author_id: CONTRIBUTOR,
        validator_id: null,
        status: 'pending_client_validation',
        submitted_at: new Date('2025-03-20T10:00:00Z'),
        created_at: now,
        updated_at: now,
      },

      // --- PROJECT 2: Refonte Site Web MIPISE ---
      {
        id: 'a7b2c3d4-0003-4000-8000-000000000003',
        project_id: PROJECT_2,
        version_number: 1,
        title: 'Maquettes UI site web — V1',
        description: 'Maquettes haute fidélité Figma des 5 pages principales. Design responsive, mode sombre optionnel.',
        file_path: null,
        author_id: CONTRIBUTOR,
        validator_id: null,
        status: 'pending_client_validation',
        submitted_at: new Date('2025-03-25T09:00:00Z'),
        created_at: now,
        updated_at: now,
      },

      // --- PROJECT 3: Rapport Annuel MIPISE ---
      {
        id: 'a7b2c3d4-0004-4000-8000-000000000004',
        project_id: PROJECT_3,
        version_number: 1,
        title: 'Gabarit rapport annuel — V1',
        description: 'Proposition de gabarit éditorial : couverture, sommaire, mise en page type chapitres, infographies.',
        file_path: null,
        author_id: CONTRIBUTOR,
        validator_id: null,
        status: 'draft',
        submitted_at: null,
        created_at: now,
        updated_at: now,
      },

      // --- PROJECT 4: Brochure Zones Franches API-ZF ---
      {
        id: 'a7b2c3d4-0005-4000-8000-000000000005',
        project_id: PROJECT_4,
        version_number: 1,
        title: 'Maquette brochure trilingue — V1',
        description: 'Première maquette de la brochure 24 pages. Mise en page bilingue FR/AR avec encarts EN.',
        file_path: null,
        author_id: CONTRIBUTOR,
        validator_id: null,
        status: 'submitted',
        submitted_at: new Date('2025-03-18T11:00:00Z'),
        created_at: now,
        updated_at: now,
      },
      {
        id: 'a7b2c3d4-0006-4000-8000-000000000006',
        project_id: PROJECT_4,
        version_number: 2,
        title: 'Maquette brochure trilingue — V2',
        description: 'Version révisée avec corrections de mise en page et intégration photos terrain.',
        file_path: null,
        author_id: CONTRIBUTOR,
        validator_id: null,
        status: 'pending_client_validation',
        submitted_at: new Date('2025-03-28T15:00:00Z'),
        created_at: now,
        updated_at: now,
      },

      // --- PROJECT 5: Vidéo Promotionnelle API-ZF ---
      {
        id: 'a7b2c3d4-0007-4000-8000-000000000007',
        project_id: PROJECT_5,
        version_number: 1,
        title: 'Vidéo motion design finale',
        description: 'Version finale de la vidéo promotionnelle avec voix-off professionnelle et sous-titrage trilingue.',
        file_path: null,
        author_id: CONTRIBUTOR,
        validator_id: VALIDATOR,
        status: 'approved',
        submitted_at: new Date('2025-02-15T16:00:00Z'),
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('proposals', {
      id: [
        'a7b2c3d4-0001-4000-8000-000000000001',
        'a7b2c3d4-0002-4000-8000-000000000002',
        'a7b2c3d4-0003-4000-8000-000000000003',
        'a7b2c3d4-0004-4000-8000-000000000004',
        'a7b2c3d4-0005-4000-8000-000000000005',
        'a7b2c3d4-0006-4000-8000-000000000006',
        'a7b2c3d4-0007-4000-8000-000000000007',
      ],
    });
  },
};
