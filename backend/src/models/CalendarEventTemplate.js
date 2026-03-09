'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CalendarEventTemplate = sequelize.define('CalendarEventTemplate', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
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
    tableName: 'calendar_event_templates',
    timestamps: true,
    underscored: true,
  });

  CalendarEventTemplate.associate = (models) => {
    CalendarEventTemplate.belongsTo(models.User, { as: 'creator', foreignKey: 'created_by' });
  };

  return CalendarEventTemplate;
};

