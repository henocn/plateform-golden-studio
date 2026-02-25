'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'publications',
      'task_id',
      {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'tasks', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      }
    );
    await queryInterface.addIndex('publications', ['task_id'], { name: 'idx_publications_task_id' });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('publications', 'task_id');
  },
};
