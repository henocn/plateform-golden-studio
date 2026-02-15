'use strict';

const ORG_MIPISE = 'a1b2c3d4-0001-4000-8000-000000000001';
const ORG_APIZF  = 'a1b2c3d4-0002-4000-8000-000000000002';

const PROJECT_1 = 'd1b2c3d4-0001-4000-8000-000000000001';
const PROJECT_2 = 'd1b2c3d4-0002-4000-8000-000000000002';
const PROJECT_3 = 'd1b2c3d4-0003-4000-8000-000000000003';
const PROJECT_4 = 'd1b2c3d4-0004-4000-8000-000000000004';
const PROJECT_5 = 'd1b2c3d4-0005-4000-8000-000000000005';

const CLIENT_MIPISE_ADMIN = 'c1b2c3d4-0001-4000-8000-000000000001';
const CLIENT_APIZF_ADMIN  = 'c1b2c3d4-0004-4000-8000-000000000004';
const CONTRIBUTOR          = 'b1b2c3d4-0004-4000-8000-000000000004';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('briefs', [
      {
        id: 'e1b2c3d4-0001-4000-8000-000000000001',
        project_id: PROJECT_1,
        organization_id: ORG_MIPISE,
        description: 'Concevoir une campagne institutionnelle moderne reflétant les valeurs du ministère : transparence, innovation, proximité citoyenne. La campagne doit couvrir les supports print (affiches A3, roll-ups) et digitaux (bannières web, posts réseaux sociaux).',
        objective: 'Renforcer l\'image institutionnelle du MIPISE auprès du grand public et des investisseurs.',
        target_audience: 'Grand public algérien, investisseurs nationaux et internationaux, partenaires institutionnels.',
        key_message: 'Le MIPISE, moteur de l\'industrie algérienne de demain.',
        deadline: '2025-04-15',
        submitted_by: CLIENT_MIPISE_ADMIN,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'e1b2c3d4-0002-4000-8000-000000000002',
        project_id: PROJECT_2,
        organization_id: ORG_MIPISE,
        description: 'Refondre intégralement le site web du ministère avec une architecture responsive, conforme aux standards d\'accessibilité RGAA. Intégrer un espace actualités, un portail investisseur et un annuaire des services.',
        objective: 'Moderniser la présence digitale du ministère et améliorer l\'accès aux informations.',
        target_audience: 'Citoyens, entreprises, investisseurs, médias.',
        key_message: 'Un ministère connecté, accessible et transparent.',
        deadline: '2025-03-15',
        submitted_by: CLIENT_MIPISE_ADMIN,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'e1b2c3d4-0003-4000-8000-000000000003',
        project_id: PROJECT_3,
        organization_id: ORG_MIPISE,
        description: 'Mettre en page et illustrer le rapport annuel d\'activité 2024 du ministère. Document de 80 pages environ avec infographies, données chiffrées et témoignages.',
        objective: 'Présenter de manière claire et impactante le bilan annuel des réalisations du ministère.',
        target_audience: 'Parlementaires, partenaires internationaux, cadres du ministère.',
        key_message: 'Un bilan solide, des perspectives ambitieuses.',
        deadline: '2025-03-01',
        submitted_by: CLIENT_MIPISE_ADMIN,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'e1b2c3d4-0004-4000-8000-000000000004',
        project_id: PROJECT_4,
        organization_id: ORG_APIZF,
        description: 'Créer une brochure trilingue (arabe, français, anglais) de présentation des zones franches d\'investissement. Format A4, 24 pages, impression offset haute qualité.',
        objective: 'Attirer les investisseurs vers les zones franches algériennes.',
        target_audience: 'Investisseurs internationaux, chambres de commerce, délégations diplomatiques.',
        key_message: 'L\'Algérie, terre d\'opportunités pour vos investissements.',
        deadline: '2025-04-01',
        submitted_by: CLIENT_APIZF_ADMIN,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'e1b2c3d4-0005-4000-8000-000000000005',
        project_id: PROJECT_5,
        organization_id: ORG_APIZF,
        description: 'Réaliser une vidéo de 3 minutes en motion design présentant les avantages des zones franches : fiscalité, infrastructure, accompagnement. Sous-titrée en 3 langues.',
        objective: 'Créer un support audiovisuel moderne pour les salons et événements internationaux.',
        target_audience: 'Investisseurs lors de salons professionnels, web.',
        key_message: 'Votre succès commence ici — API-ZF, votre partenaire stratégique.',
        deadline: '2025-02-01',
        submitted_by: CLIENT_APIZF_ADMIN,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('briefs', {
      id: [
        'e1b2c3d4-0001-4000-8000-000000000001',
        'e1b2c3d4-0002-4000-8000-000000000002',
        'e1b2c3d4-0003-4000-8000-000000000003',
        'e1b2c3d4-0004-4000-8000-000000000004',
        'e1b2c3d4-0005-4000-8000-000000000005',
      ],
    });
  },
};
