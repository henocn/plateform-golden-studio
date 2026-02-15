'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('publications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'projects', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'organizations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      proposal_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'proposals', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      publication_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      channel: {
        type: Sequelize.ENUM('facebook', 'linkedin', 'official_release', 'website', 'tv', 'radio', 'other'),
        allowNull: false,
        defaultValue: 'other',
      },
      link: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      archive_path: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addIndex('publications', ['project_id'], { name: 'idx_publications_project_id' });
    await queryInterface.addIndex('publications', ['organization_id'], { name: 'idx_publications_organization_id' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('publications');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_publications_channel";');
  },
};
