'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('projects', 'agency_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'agencies', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addColumn('projects', 'direction_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'directions', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addIndex('projects', ['agency_id'], { name: 'idx_projects_agency_id' });
    await queryInterface.addIndex('projects', ['direction_id'], { name: 'idx_projects_direction_id' });
    await queryInterface.removeColumn('projects', 'agency_direction');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('projects', 'direction_id');
    await queryInterface.removeColumn('projects', 'agency_id');
    await queryInterface.addColumn('projects', 'agency_direction', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
};
