'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Brief = sequelize.define('Brief', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    organization_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { notEmpty: true },
    },
    objective: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    target_audience: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    key_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    deadline: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    submitted_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  }, {
    tableName: 'briefs',
    timestamps: true,
    underscored: true,
  });

  Brief.associate = (models) => {
    Brief.belongsTo(models.Project, { as: 'project', foreignKey: 'project_id' });
    Brief.belongsTo(models.Organization, { as: 'organization', foreignKey: 'organization_id' });
    Brief.belongsTo(models.User, { as: 'submitter', foreignKey: 'submitted_by' });
    Brief.hasMany(models.BriefAttachment, { as: 'attachments', foreignKey: 'brief_id' });
  };

  return Brief;
};
