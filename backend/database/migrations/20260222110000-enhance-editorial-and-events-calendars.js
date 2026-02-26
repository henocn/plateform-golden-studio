'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('publications', 'project_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'projects', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('publications', 'publication_title', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('publications', 'publisher_name', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('publications', 'networks', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: [],
    });
    await queryInterface.addColumn('publications', 'publication_lines', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: [],
    });
    await queryInterface.addColumn('publications', 'notes', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.sequelize.query(
      "ALTER TYPE \"enum_calendar_events_type\" ADD VALUE IF NOT EXISTS 'other';"
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('publications', 'notes');
    await queryInterface.removeColumn('publications', 'publication_lines');
    await queryInterface.removeColumn('publications', 'networks');
    await queryInterface.removeColumn('publications', 'publisher_name');
    await queryInterface.removeColumn('publications', 'publication_title');

    await queryInterface.changeColumn('publications', 'project_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'projects', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  },
};

