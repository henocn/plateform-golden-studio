'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Project = sequelize.define('Project', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    organization_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true, len: [2, 255] },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    agency_direction: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    internal_manager_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    studio_manager_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    client_contact_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
      allowNull: false,
      defaultValue: 'normal',
    },
    status: {
      type: DataTypes.ENUM('brief_received', 'in_production', 'in_validation', 'published', 'archived'),
      allowNull: false,
      defaultValue: 'brief_received',
    },
    target_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  }, {
    tableName: 'projects',
    timestamps: true,
    underscored: true,
  });

  Project.associate = (models) => {
    Project.belongsTo(models.Organization, { as: 'organization', foreignKey: 'organization_id' });
    Project.belongsTo(models.User, { as: 'internalManager', foreignKey: 'internal_manager_id' });
    Project.belongsTo(models.User, { as: 'studioManager', foreignKey: 'studio_manager_id' });
    Project.belongsTo(models.User, { as: 'clientContact', foreignKey: 'client_contact_id' });
    Project.belongsTo(models.User, { as: 'creator', foreignKey: 'created_by' });
    Project.hasMany(models.Brief, { as: 'briefs', foreignKey: 'project_id' });
    Project.hasMany(models.Task, { as: 'tasks', foreignKey: 'project_id' });
    // Project.hasMany(models.Proposal, { as: 'proposals', foreignKey: 'project_id' });
    Project.hasMany(models.Publication, { as: 'publications', foreignKey: 'project_id' });
    Project.hasMany(models.CalendarEvent, { as: 'calendarEvents', foreignKey: 'project_id' });
  };

  return Project;
};
