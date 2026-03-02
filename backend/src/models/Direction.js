'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Direction = sequelize.define('Direction', {
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
    agency_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  }, {
    tableName: 'directions',
    timestamps: true,
    underscored: true,
  });

  Direction.associate = (models) => {
    Direction.belongsTo(models.Agency, { as: 'agency', foreignKey: 'agency_id' });
    Direction.hasMany(models.Project, { as: 'projects', foreignKey: 'direction_id' });
  };

  return Direction;
};
