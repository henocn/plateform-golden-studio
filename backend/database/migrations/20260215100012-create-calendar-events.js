'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('calendar_events', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'organizations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      project_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'projects', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('publication', 'event_coverage', 'filming', 'deliverable_deadline', 'meeting'),
        allowNull: false,
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('pending', 'validated', 'scheduled', 'published', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      visibility: {
        type: Sequelize.ENUM('internal_only', 'client_visible'),
        allowNull: false,
        defaultValue: 'client_visible',
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addIndex('calendar_events', ['organization_id'], { name: 'idx_calendar_events_org_id' });
    await queryInterface.addIndex('calendar_events', ['start_date'], { name: 'idx_calendar_events_start_date' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('calendar_events');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_calendar_events_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_calendar_events_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_calendar_events_visibility";');
  },
};
