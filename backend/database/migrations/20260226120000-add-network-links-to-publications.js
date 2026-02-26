'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('publications');
    if (!table.network_links) {
      await queryInterface.addColumn('publications', 'network_links', {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('publications');
    if (table.network_links) {
      await queryInterface.removeColumn('publications', 'network_links');
    }
  },
};

