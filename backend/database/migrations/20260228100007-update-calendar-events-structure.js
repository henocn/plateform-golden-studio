'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ─── Colonnes simples ─────────────────────────────────────────────
    // Rendre la migration idempotente : ne supprimer les colonnes
    // que si elles existent encore (en cas de run partiel précédent).
    const table = await queryInterface.describeTable('calendar_events');

    if (table.project_id) {
      await queryInterface.removeColumn('calendar_events', 'project_id');
    }
    if (table.type) {
      await queryInterface.removeColumn('calendar_events', 'type');
    }
    if (table.visibility) {
      await queryInterface.removeColumn('calendar_events', 'visibility');
    }

    if (!table.agency_id) {
      await queryInterface.addColumn('calendar_events', 'agency_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'agencies', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }

    if (!table.direction_id) {
      await queryInterface.addColumn('calendar_events', 'direction_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'directions', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }

    if (!table.tasks) {
      await queryInterface.addColumn('calendar_events', 'tasks', {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
      });
    }

    // ─── Enum status : ajout des nouvelles valeurs et migration ───────
    // Ajoute les nouvelles valeurs au type enum existant (idempotent)
    await queryInterface.sequelize.query(
      'ALTER TYPE "enum_calendar_events_status" ADD VALUE IF NOT EXISTS \'in_progress\';',
    );
    await queryInterface.sequelize.query(
      'ALTER TYPE "enum_calendar_events_status" ADD VALUE IF NOT EXISTS \'done\';',
    );

    // Remappe les anciens statuts vers le nouveau jeu (validated/scheduled/published → done)
    await queryInterface.sequelize.query(
      `
      UPDATE "calendar_events"
      SET "status" = 'done'
      WHERE "status" IN ('validated', 'scheduled', 'published');
      `,
    );

    // Défaut sur pending pour les nouvelles lignes
    await queryInterface.sequelize.query(
      'ALTER TABLE "calendar_events" ALTER COLUMN "status" SET DEFAULT \'pending\';',
    );
  },

  async down(queryInterface, Sequelize) {
    // Ré‑ajoute les anciennes colonnes (structure originale simplifiée)
    await queryInterface.addColumn('calendar_events', 'project_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'projects', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('calendar_events', 'type', {
      type: Sequelize.ENUM('publication', 'event_coverage', 'filming', 'deliverable_deadline', 'meeting', 'other'),
      allowNull: false,
      defaultValue: 'meeting',
    });

    await queryInterface.addColumn('calendar_events', 'visibility', {
      type: Sequelize.ENUM('internal_only', 'client_visible'),
      allowNull: false,
      defaultValue: 'client_visible',
    });

    await queryInterface.removeColumn('calendar_events', 'agency_id');
    await queryInterface.removeColumn('calendar_events', 'direction_id');
    await queryInterface.removeColumn('calendar_events', 'tasks');

    // On ne rétablit pas l'ancien jeu de valeurs de status par simplicité.
  },
};

