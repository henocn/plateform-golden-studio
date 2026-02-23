'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Folder = sequelize.define('Folder', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    parent_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    organization_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    is_global: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  }, {
    tableName: 'folders',
    timestamps: true,
    underscored: true,
  });

  Folder.associate = (models) => {
    Folder.belongsTo(models.Organization, { as: 'organization', foreignKey: 'organization_id' });
    Folder.belongsTo(models.User, { as: 'creator', foreignKey: 'created_by' });
    Folder.belongsTo(models.Folder, { as: 'parent', foreignKey: 'parent_id' });
    Folder.hasMany(models.Folder, { as: 'subfolders', foreignKey: 'parent_id' });
    Folder.hasMany(models.Media, { as: 'media', foreignKey: 'folder_id' });
  };

  return Folder;
};