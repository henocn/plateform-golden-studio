'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Media = sequelize.define('Media', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    folder_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    type: {
      type: DataTypes.ENUM('logo', 'graphic_charter', 'video', 'photo', 'template', 'document', 'other'),
      allowNull: false,
      defaultValue: 'other',
    },
    tags: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    file_path: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    file_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    mime_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_global: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    uploaded_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  }, {
    tableName: 'media',
    timestamps: true,
    underscored: true,
  });

  Media.associate = (models) => {
    Media.belongsTo(models.User, { as: 'uploader', foreignKey: 'uploaded_by' });
    Media.belongsTo(models.Folder, { as: 'folder', foreignKey: 'folder_id' });
  };

  return Media;
};
