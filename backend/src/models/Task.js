'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Task = sequelize.define('Task', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    event_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    assigned_to: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('todo', 'in_production', 'done', 'blocked', 'cancelled'),
      allowNull: false,
      defaultValue: 'todo',
    },
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
      allowNull: false,
      defaultValue: 'normal',
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    supervisor_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    publication_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    context: {
      type: DataTypes.ENUM('project', 'event'),
      allowNull: false,
      defaultValue: 'project',
    },
  }, {
    tableName: 'tasks',
    timestamps: true,
    underscored: true,
  });

  Task.associate = (models) => {
    Task.belongsTo(models.Project, { as: 'project', foreignKey: 'project_id' });
    Task.belongsTo(models.User, { as: 'assignee', foreignKey: 'assigned_to' });
    Task.belongsTo(models.User, { as: 'creator', foreignKey: 'created_by' });
    Task.belongsTo(models.User, { as: 'supervisor', foreignKey: 'supervisor_id' });
    Task.belongsTo(models.CalendarEvent, { as: 'event', foreignKey: 'event_id' });
    Task.hasMany(models.TaskComment, { as: 'comments', foreignKey: 'task_id' });
    Task.hasMany(models.Proposal, { as: 'proposals', foreignKey: 'task_id' });
  };

  return Task;
};
