'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('tasks', 'event_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'calendar_events', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addIndex('tasks', ['event_id'], {
      name: 'idx_tasks_event_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('tasks', 'idx_tasks_event_id').catch(() => {});
    await queryInterface.removeColumn('tasks', 'event_id').catch(() => {});
  },
};

