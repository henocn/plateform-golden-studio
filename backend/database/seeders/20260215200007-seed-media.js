'use strict';

const ADMIN = 'b1b2c3d4-0001-4000-8000-000000000001';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('media', [
      {
        id: 'a8b2c3d4-0001-4000-8000-000000000001',
        organization_id: null,
        name: 'Logo Golden Studio — Couleur',
        type: 'logo',
        tags: JSON.stringify(['logo', 'golden-studio', 'couleur', 'identité']),
        file_path: 'uploads/media/logo-golden-studio-color.png',
        file_name: 'logo-golden-studio-color.png',
        file_size: 45200,
        mime_type: 'image/png',
        is_global: true,
        uploaded_by: ADMIN,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'a8b2c3d4-0002-4000-8000-000000000002',
        organization_id: null,
        name: 'Logo Golden Studio — Monochrome',
        type: 'logo',
        tags: JSON.stringify(['logo', 'golden-studio', 'monochrome', 'noir-blanc']),
        file_path: 'uploads/media/logo-golden-studio-mono.png',
        file_name: 'logo-golden-studio-mono.png',
        file_size: 28400,
        mime_type: 'image/png',
        is_global: true,
        uploaded_by: ADMIN,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'a8b2c3d4-0003-4000-8000-000000000003',
        organization_id: null,
        name: 'Charte Graphique Golden Studio 2025',
        type: 'graphic_charter',
        tags: JSON.stringify(['charte-graphique', 'golden-studio', 'guidelines', '2025']),
        file_path: 'uploads/media/charte-graphique-gs-2025.pdf',
        file_name: 'charte-graphique-gs-2025.pdf',
        file_size: 2450000,
        mime_type: 'application/pdf',
        is_global: true,
        uploaded_by: ADMIN,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('media', {
      id: [
        'a8b2c3d4-0001-4000-8000-000000000001',
        'a8b2c3d4-0002-4000-8000-000000000002',
        'a8b2c3d4-0003-4000-8000-000000000003',
      ],
    });
  },
};
