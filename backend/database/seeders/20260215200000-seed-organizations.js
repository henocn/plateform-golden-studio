'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('organizations', [
      {
        id: 'a1b2c3d4-0001-4000-8000-000000000001',
        name: 'Ministère de l\'Industrie et de la Promotion des Investissements (MIPISE)',
        short_name: 'MIPISE',
        type: 'ministry',
        logo_path: null,
        contact_email: 'contact@mipise.gov.dz',
        contact_phone: '+213 21 00 00 01',
        address: 'Alger, Algérie',
        is_active: true,
        created_by: null,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'a1b2c3d4-0002-4000-8000-000000000002',
        name: 'Agence de Promotion des Investissements — Zone Franche (API-ZF)',
        short_name: 'API-ZF',
        type: 'agency',
        logo_path: null,
        contact_email: 'contact@api-zf.gov.dz',
        contact_phone: '+213 21 00 00 02',
        address: 'Oran, Algérie',
        is_active: true,
        created_by: null,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('organizations', {
      id: [
        'a1b2c3d4-0001-4000-8000-000000000001',
        'a1b2c3d4-0002-4000-8000-000000000002',
      ],
    });
  },
};
