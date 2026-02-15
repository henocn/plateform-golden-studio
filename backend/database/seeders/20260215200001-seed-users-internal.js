'use strict';

// Passwords pre-hashed with bcrypt (12 rounds)
// admin@goldenstudio.com    → Admin@1234
// manager@goldenstudio.com  → Manager@1234
// validator@goldenstudio.com→ Validator@1234
// creator@goldenstudio.com  → Creator@1234

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('users', [
      {
        id: 'b1b2c3d4-0001-4000-8000-000000000001',
        email: 'admin@goldenstudio.com',
        password_hash: '$2b$12$n9fa4tYAdK4edi1tD/OvEOgnEBf6imdjtinHYNNMIhBg6EhHT0MAG',
        first_name: 'Super',
        last_name: 'Admin',
        user_type: 'internal',
        role: 'super_admin',
        organization_id: null,
        job_title: 'Directeur Technique',
        avatar_path: null,
        is_active: true,
        two_factor_secret: null,
        two_factor_enabled: false,
        last_login_at: null,
        created_by: null,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'b1b2c3d4-0002-4000-8000-000000000002',
        email: 'manager@goldenstudio.com',
        password_hash: '$2b$12$DsG3WTOZkU2BuvCgeo8X5.0FbIakjC51hLDh.CkBhHHQ/N1OG1Kly',
        first_name: 'Mohamed',
        last_name: 'Manager',
        user_type: 'internal',
        role: 'admin',
        organization_id: null,
        job_title: 'Chef de Projet',
        avatar_path: null,
        is_active: true,
        two_factor_secret: null,
        two_factor_enabled: false,
        last_login_at: null,
        created_by: 'b1b2c3d4-0001-4000-8000-000000000001',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'b1b2c3d4-0003-4000-8000-000000000003',
        email: 'validator@goldenstudio.com',
        password_hash: '$2b$12$8pr97/fQNyEyY1p0hq.DCe.28KBJRetB9VIUVnbRfu2MwkzX8/.wy',
        first_name: 'Sara',
        last_name: 'Validator',
        user_type: 'internal',
        role: 'validator',
        organization_id: null,
        job_title: 'Responsable Qualité',
        avatar_path: null,
        is_active: true,
        two_factor_secret: null,
        two_factor_enabled: false,
        last_login_at: null,
        created_by: 'b1b2c3d4-0001-4000-8000-000000000001',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'b1b2c3d4-0004-4000-8000-000000000004',
        email: 'creator@goldenstudio.com',
        password_hash: '$2b$12$wepEJQtF5Dh2hbvqB0VmJOiOns5SAB7NR5NXzyVzSmWRlz.B7oNIq',
        first_name: 'Karim',
        last_name: 'Creator',
        user_type: 'internal',
        role: 'contributor',
        organization_id: null,
        job_title: 'Créateur de Contenu',
        avatar_path: null,
        is_active: true,
        two_factor_secret: null,
        two_factor_enabled: false,
        last_login_at: null,
        created_by: 'b1b2c3d4-0001-4000-8000-000000000001',
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', {
      id: [
        'b1b2c3d4-0001-4000-8000-000000000001',
        'b1b2c3d4-0002-4000-8000-000000000002',
        'b1b2c3d4-0003-4000-8000-000000000003',
        'b1b2c3d4-0004-4000-8000-000000000004',
      ],
    });
  },
};
