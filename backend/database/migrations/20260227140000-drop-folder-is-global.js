'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('folders');
    if (table.is_global) {
      await queryInterface.removeColumn('folders', 'is_global');
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('folders');
    if (!table.is_global) {
      await queryInterface.addColumn('folders', 'is_global', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
  },
};

