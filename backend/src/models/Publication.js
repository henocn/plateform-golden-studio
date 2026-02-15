'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Publication = sequelize.define('Publication', {
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
    proposal_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    publication_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    channel: {
      type: DataTypes.ENUM('facebook', 'linkedin', 'official_release', 'website', 'tv', 'radio', 'other'),
      allowNull: false,
      defaultValue: 'other',
    },
    link: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    archive_path: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  }, {
    tableName: 'publications',
    timestamps: true,
    underscored: true,
  });

  Publication.associate = (models) => {
    Publication.belongsTo(models.Project, { as: 'project', foreignKey: 'project_id' });
    Publication.belongsTo(models.Organization, { as: 'organization', foreignKey: 'organization_id' });
    Publication.belongsTo(models.Proposal, { as: 'proposal', foreignKey: 'proposal_id' });
    Publication.belongsTo(models.User, { as: 'creator', foreignKey: 'created_by' });
  };

  return Publication;
};
