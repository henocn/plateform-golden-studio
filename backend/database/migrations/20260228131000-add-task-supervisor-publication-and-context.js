'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Superviseur de la tâche (indépendant du projet ou de l'événement)
    await queryInterface.addColumn('tasks', 'supervisor_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    // Date de publication (début de l'événement ou date cible d'une tâche d'événement)
    await queryInterface.addColumn('tasks', 'publication_date', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });

    // Contexte de la tâche: projet ou événement
    await queryInterface.addColumn('tasks', 'context', {
      type: Sequelize.ENUM('project', 'event'),
      allowNull: false,
      defaultValue: 'project',
    });

    await queryInterface.addIndex('tasks', ['supervisor_id'], { name: 'idx_tasks_supervisor_id' });
    await queryInterface.addIndex('tasks', ['context'], { name: 'idx_tasks_context' });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('tasks', 'idx_tasks_supervisor_id').catch(() => {});
    await queryInterface.removeIndex('tasks', 'idx_tasks_context').catch(() => {});
    await queryInterface.removeColumn('tasks', 'supervisor_id').catch(() => {});
    await queryInterface.removeColumn('tasks', 'publication_date').catch(() => {});
    await queryInterface.removeColumn('tasks', 'context').catch(() => {});
    await queryInterface.sequelize
      .query('DROP TYPE IF EXISTS "enum_tasks_context";')
      .catch(() => {});
  },
};

