'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('proposals');

    if (table.project_id) {
      await queryInterface.removeIndex('proposals', 'idx_proposals_project_id').catch(() => {});
      await queryInterface.removeColumn('proposals', 'project_id');
    }

    if (table.organization_id) {
      await queryInterface.removeIndex('proposals', 'idx_proposals_organization_id').catch(() => {});
      await queryInterface.removeColumn('proposals', 'organization_id');
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('proposals');

    if (!table.project_id) {
      await queryInterface.addColumn('proposals', 'project_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'projects', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
      await queryInterface.addIndex('proposals', ['project_id'], { name: 'idx_proposals_project_id' });
    }

    if (!table.organization_id) {
      await queryInterface.addColumn('proposals', 'organization_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'organizations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
      await queryInterface.addIndex('proposals', ['organization_id'], { name: 'idx_proposals_organization_id' });
    }
  },
};

