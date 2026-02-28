'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Agency = sequelize.define('Agency', {
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
    code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    tableName: 'agencies',
    timestamps: true,
    underscored: true,
  });

  Agency.associate = (models) => {
    Agency.hasMany(models.Direction, { as: 'directions', foreignKey: 'agency_id' });
    Agency.hasMany(models.Project, { as: 'projects', foreignKey: 'agency_id' });
  };

  return Agency;
};
