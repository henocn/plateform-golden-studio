'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const tables = [
      'users',
      'projects',
      'tasks',
      'task_comments',
      'proposals',
      'proposal_comments',
      'validations',
      'publications',
      'calendar_events',
      'media',
      'folders',
      'audit_logs',
    ];

    for (const table of tables) {
      const tableDesc = await queryInterface.describeTable(table);
      if (tableDesc.organization_id) {
        await queryInterface.removeColumn(table, 'organization_id');
      }
    }

    const briefTables = ['briefs', 'brief_attachments'];
    for (const table of briefTables) {
      try {
        const tableDesc = await queryInterface.describeTable(table);
        if (tableDesc.organization_id) {
          await queryInterface.removeColumn(table, 'organization_id');
        }
      } catch (_e) {
        // briefs/brief_attachments may have been dropped already
      }
    }
  },

  async down(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    const tablesNonNull = [
      'projects',
      'tasks',
      'task_comments',
      'proposals',
      'proposal_comments',
      'validations',
      'publications',
      'calendar_events',
    ];

    const tablesNullable = [
      'users',
      'media',
      'folders',
      'audit_logs',
    ];

    for (const table of tablesNonNull) {
      await queryInterface.addColumn(table, 'organization_id', {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'organizations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }

    for (const table of tablesNullable) {
      await queryInterface.addColumn(table, 'organization_id', {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'organizations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }
  },
};
