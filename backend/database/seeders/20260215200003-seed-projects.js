'use strict';

const ORG_MIPISE   = 'a1b2c3d4-0001-4000-8000-000000000001';
const ORG_APIZF    = 'a1b2c3d4-0002-4000-8000-000000000002';
const ADMIN        = 'b1b2c3d4-0001-4000-8000-000000000001';
const MANAGER      = 'b1b2c3d4-0002-4000-8000-000000000002';
const CONTRIBUTOR  = 'b1b2c3d4-0004-4000-8000-000000000004';
const CLIENT_MIPISE = 'c1b2c3d4-0001-4000-8000-000000000001';
const CLIENT_APIZF  = 'c1b2c3d4-0004-4000-8000-000000000004';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('projects', [
      // --- 3 projets MIPISE ---
      {
        id: 'd1b2c3d4-0001-4000-8000-000000000001',
        organization_id: ORG_MIPISE,
        title: 'Campagne Institutionnelle MIPISE 2025',
        description: 'Conception et déploiement de la campagne de communication institutionnelle du ministère pour l\'année 2025. Inclut identité visuelle, supports print et digital.',
        agency_direction: 'Direction de la Communication',
        internal_manager_id: MANAGER,
        studio_manager_id: CONTRIBUTOR,
        client_contact_id: CLIENT_MIPISE,
        priority: 'high',
        status: 'in_production',
        target_date: '2025-06-30',
        created_by: ADMIN,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'd1b2c3d4-0002-4000-8000-000000000002',
        organization_id: ORG_MIPISE,
        title: 'Refonte Site Web MIPISE',
        description: 'Refonte complète du site web institutionnel du ministère. Migration vers une architecture moderne, responsive, conforme RGAA.',
        agency_direction: 'Direction des Systèmes d\'Information',
        internal_manager_id: ADMIN,
        studio_manager_id: CONTRIBUTOR,
        client_contact_id: CLIENT_MIPISE,
        priority: 'urgent',
        status: 'in_validation',
        target_date: '2025-04-15',
        created_by: ADMIN,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'd1b2c3d4-0003-4000-8000-000000000003',
        organization_id: ORG_MIPISE,
        title: 'Rapport Annuel MIPISE 2024',
        description: 'Conception graphique et mise en page du rapport annuel d\'activité du ministère pour l\'exercice 2024.',
        agency_direction: 'Direction Générale',
        internal_manager_id: MANAGER,
        studio_manager_id: CONTRIBUTOR,
        client_contact_id: CLIENT_MIPISE,
        priority: 'normal',
        status: 'brief_received',
        target_date: '2025-03-31',
        created_by: ADMIN,
        created_at: now,
        updated_at: now,
      },

      // --- 2 projets API-ZF ---
      {
        id: 'd1b2c3d4-0004-4000-8000-000000000004',
        organization_id: ORG_APIZF,
        title: 'Brochure Zones Franches 2025',
        description: 'Création d\'une brochure de promotion des zones franches d\'investissement en Algérie. Trilingue : arabe, français, anglais.',
        agency_direction: 'Direction de la Promotion',
        internal_manager_id: MANAGER,
        studio_manager_id: CONTRIBUTOR,
        client_contact_id: CLIENT_APIZF,
        priority: 'high',
        status: 'in_production',
        target_date: '2025-05-15',
        created_by: ADMIN,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'd1b2c3d4-0005-4000-8000-000000000005',
        organization_id: ORG_APIZF,
        title: 'Vidéo Promotionnelle API-ZF',
        description: 'Réalisation d\'une vidéo promotionnelle de 3 minutes présentant les avantages des zones franches pour les investisseurs nationaux et internationaux.',
        agency_direction: 'Direction de la Communication',
        internal_manager_id: ADMIN,
        studio_manager_id: CONTRIBUTOR,
        client_contact_id: CLIENT_APIZF,
        priority: 'normal',
        status: 'published',
        target_date: '2025-02-28',
        created_by: ADMIN,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('projects', {
      id: [
        'd1b2c3d4-0001-4000-8000-000000000001',
        'd1b2c3d4-0002-4000-8000-000000000002',
        'd1b2c3d4-0003-4000-8000-000000000003',
        'd1b2c3d4-0004-4000-8000-000000000004',
        'd1b2c3d4-0005-4000-8000-000000000005',
      ],
    });
  },
};
