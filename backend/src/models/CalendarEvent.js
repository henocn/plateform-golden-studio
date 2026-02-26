'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CalendarEvent = sequelize.define('CalendarEvent', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    organization_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    type: {
      type: DataTypes.ENUM('publication', 'event_coverage', 'filming', 'deliverable_deadline', 'meeting', 'other'),
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'validated', 'scheduled', 'published', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    visibility: {
      type: DataTypes.ENUM('internal_only', 'client_visible'),
      allowNull: false,
      defaultValue: 'client_visible',
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  }, {
    tableName: 'calendar_events',
    timestamps: true,
    underscored: true,
  });

  CalendarEvent.associate = (models) => {
    CalendarEvent.belongsTo(models.Organization, { as: 'organization', foreignKey: 'organization_id' });
    CalendarEvent.belongsTo(models.Project, { as: 'project', foreignKey: 'project_id' });
    CalendarEvent.belongsTo(models.User, { as: 'creator', foreignKey: 'created_by' });
  };

  return CalendarEvent;
};
