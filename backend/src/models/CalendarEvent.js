'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CalendarEvent = sequelize.define('CalendarEvent', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
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
      type: DataTypes.ENUM('pending', 'in_progress', 'done', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    agency_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    direction_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    tasks: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
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
    CalendarEvent.belongsTo(models.User, { as: 'creator', foreignKey: 'created_by' });
    CalendarEvent.belongsTo(models.Agency, { as: 'agency', foreignKey: 'agency_id' });
    CalendarEvent.belongsTo(models.Direction, { as: 'direction', foreignKey: 'direction_id' });
  };

  return CalendarEvent;
};
