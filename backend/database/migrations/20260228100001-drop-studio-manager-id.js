'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const tableDesc = await queryInterface.describeTable('projects');
    if (tableDesc.studio_manager_id) {
      await queryInterface.removeColumn('projects', 'studio_manager_id');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('projects', 'studio_manager_id', {
      type: Sequelize.DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },
};
