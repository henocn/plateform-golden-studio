"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("publications", "status", {
      type: Sequelize.ENUM("scheduled", "published", "draft", "archived"),
      allowNull: false,
      defaultValue: "published",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("publications", "status");
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_publications_status\";");
  },
};
