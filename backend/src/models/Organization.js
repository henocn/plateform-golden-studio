'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Organization = sequelize.define('Organization', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 255],
      },
    },
    short_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('ministry', 'agency', 'direction', 'other'),
      allowNull: false,
      defaultValue: 'other',
    },
    logo_path: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    contact_email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    contact_phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  }, {
    tableName: 'organizations',
    timestamps: true,
    underscored: true,
  });

  Organization.associate = (models) => {
    Organization.belongsTo(models.User, { as: 'creator', foreignKey: 'created_by' });
    Organization.hasMany(models.User, { as: 'users', foreignKey: 'organization_id' });
    Organization.hasMany(models.Project, { as: 'projects', foreignKey: 'organization_id' });
  };

  return Organization;
};
