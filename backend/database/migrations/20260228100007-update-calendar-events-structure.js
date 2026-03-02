'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ─── Colonnes simples ─────────────────────────────────────────────
    await queryInterface.removeColumn('calendar_events', 'project_id');
    await queryInterface.removeColumn('calendar_events', 'type');
    await queryInterface.removeColumn('calendar_events', 'visibility');

    await queryInterface.addColumn('calendar_events', 'agency_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'agencies', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('calendar_events', 'direction_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'directions', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('calendar_events', 'tasks', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: [],
    });

    // ─── Enum status : pending / in_progress / done / cancelled ──────
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Retire le défaut actuel
      await queryInterface.sequelize.query(
        'ALTER TABLE "calendar_events" ALTER COLUMN "status" DROP DEFAULT;',
        { transaction },
      );

      // Nouveau type enum
      await queryInterface.sequelize.query(
        'CREATE TYPE "enum_calendar_events_status_new" AS ENUM (\'pending\', \'in_progress\', \'done\', \'cancelled\');',
        { transaction },
      );

      // Migration des anciennes valeurs vers le nouveau jeu
      await queryInterface.sequelize.query(
        `
        UPDATE "calendar_events"
        SET "status" = 'done'
        WHERE "status" IN ('validated', 'scheduled', 'published');
        `,
        { transaction },
      );

      // Cast de la colonne vers le nouveau type
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "calendar_events"
        ALTER COLUMN "status"
        TYPE "enum_calendar_events_status_new"
        USING "status"::text::"enum_calendar_events_status_new";
        `,
        { transaction },
      );

      // Suppression de l'ancien type puis renommage
      await queryInterface.sequelize.query(
        'DROP TYPE "enum_calendar_events_status";',
        { transaction },
      );

      await queryInterface.sequelize.query(
        'ALTER TYPE "enum_calendar_events_status_new" RENAME TO "enum_calendar_events_status";',
        { transaction },
      );

      // Nouveau défaut
      await queryInterface.sequelize.query(
        `ALTER TABLE "calendar_events" ALTER COLUMN "status" SET DEFAULT 'pending';`,
        { transaction },
      );
    });

    // Nettoyage des anciens enums inutilisés
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_calendar_events_type";',
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_calendar_events_visibility";',
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

