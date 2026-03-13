'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('calendar_events');
    if (table.tasks) {
      await queryInterface.removeColumn('calendar_events', 'tasks');
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('calendar_events');
    if (!table.tasks) {
      await queryInterface.addColumn('calendar_events', 'tasks', {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
      });
    }
  },
};

