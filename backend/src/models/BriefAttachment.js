'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BriefAttachment = sequelize.define('BriefAttachment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    brief_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    organization_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    file_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    file_path: {
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
    uploaded_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  }, {
    tableName: 'brief_attachments',
    timestamps: true,
    updatedAt: false,
    underscored: true,
  });

  BriefAttachment.associate = (models) => {
    BriefAttachment.belongsTo(models.Brief, { as: 'brief', foreignKey: 'brief_id' });
    BriefAttachment.belongsTo(models.Organization, { as: 'organization', foreignKey: 'organization_id' });
    BriefAttachment.belongsTo(models.User, { as: 'uploader', foreignKey: 'uploaded_by' });
  };

  return BriefAttachment;
};
