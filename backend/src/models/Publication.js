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
      allowNull: true,
    },
    organization_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    proposal_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    task_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    publication_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    publication_title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    publisher_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    networks: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    network_links: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    publication_lines: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
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
    status: {
      type: DataTypes.ENUM('scheduled', 'published', 'draft', 'archived'),
      allowNull: false,
      defaultValue: 'published',
    },
    archive_path: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
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
    Publication.belongsTo(models.Task, { as: 'task', foreignKey: 'task_id' });
    Publication.belongsTo(models.User, { as: 'creator', foreignKey: 'created_by' });
  };

  return Publication;
};
