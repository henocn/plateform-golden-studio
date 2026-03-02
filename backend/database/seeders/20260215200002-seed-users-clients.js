'use strict';

// All client passwords: Client@1234
// Hash: $2b$12$ZKqy/BKMt4VoV5lXJai8f.NohXqYbY0XjvnV1vqz4REU.3oMdR8pq

const SUPER_ADMIN = 'b1b2c3d4-0001-4000-8000-000000000001';
const CLIENT_HASH = '$2b$12$ZKqy/BKMt4VoV5lXJai8f.NohXqYbY0XjvnV1vqz4REU.3oMdR8pq';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('users', [
      // --- MIPISE clients ---
      {
        id: 'c1b2c3d4-0001-4000-8000-000000000001',
        email: 'admin@mipise.gov.dz',
        password_hash: CLIENT_HASH,
        first_name: 'Amina',
        last_name: 'Directrice',
        user_type: 'client',
        role: 'client_admin',
        job_title: 'Directrice Communication',
        avatar_path: null,
        is_active: true,
        two_factor_secret: null,
        two_factor_enabled: false,
        last_login_at: null,
        created_by: SUPER_ADMIN,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'c1b2c3d4-0002-4000-8000-000000000002',
        email: 'validateur@mipise.gov.dz',
        password_hash: CLIENT_HASH,
        first_name: 'Yacine',
        last_name: 'Validateur',
        user_type: 'client',
        role: 'client_validator',
        job_title: 'Responsable Validation',
        avatar_path: null,
        is_active: true,
        two_factor_secret: null,
        two_factor_enabled: false,
        last_login_at: null,
        created_by: SUPER_ADMIN,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'c1b2c3d4-0003-4000-8000-000000000003',
        email: 'lecteur@mipise.gov.dz',
        password_hash: CLIENT_HASH,
        first_name: 'Fatima',
        last_name: 'Lectrice',
        user_type: 'client',
        role: 'client_reader',
        job_title: 'Chargée de Suivi',
        avatar_path: null,
        is_active: true,
        two_factor_secret: null,
        two_factor_enabled: false,
        last_login_at: null,
        created_by: SUPER_ADMIN,
        created_at: now,
        updated_at: now,
      },

      // --- API-ZF clients ---
      {
        id: 'c1b2c3d4-0004-4000-8000-000000000004',
        email: 'admin@api-zf.gov.dz',
        password_hash: CLIENT_HASH,
        first_name: 'Rachid',
        last_name: 'Directeur',
        user_type: 'client',
        role: 'client_admin',
        job_title: 'Directeur Général',
        avatar_path: null,
        is_active: true,
        two_factor_secret: null,
        two_factor_enabled: false,
        last_login_at: null,
        created_by: SUPER_ADMIN,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'c1b2c3d4-0005-4000-8000-000000000005',
        email: 'contributeur@api-zf.gov.dz',
        password_hash: CLIENT_HASH,
        first_name: 'Nadia',
        last_name: 'Contributrice',
        user_type: 'client',
        role: 'client_contributor',
        job_title: 'Chargée de Communication',
        avatar_path: null,
        is_active: true,
        two_factor_secret: null,
        two_factor_enabled: false,
        last_login_at: null,
        created_by: SUPER_ADMIN,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', {
      id: [
        'c1b2c3d4-0001-4000-8000-000000000001',
        'c1b2c3d4-0002-4000-8000-000000000002',
        'c1b2c3d4-0003-4000-8000-000000000003',
        'c1b2c3d4-0004-4000-8000-000000000004',
        'c1b2c3d4-0005-4000-8000-000000000005',
      ],
    });
  },
};
