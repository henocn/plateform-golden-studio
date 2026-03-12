'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Proposal = sequelize.define('Proposal', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    task_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    version_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    file_path: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    file_name: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Original filename for download',
    },
    author_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    validator_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('draft', 'submitted', 'pending_client_validation', 'approved', 'needs_revision', 'rejected'),
      allowNull: false,
      defaultValue: 'draft',
    },
    submitted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'proposals',
    timestamps: true,
    underscored: true,
  });

  Proposal.associate = (models) => {
    Proposal.belongsTo(models.Task, { as: 'task', foreignKey: 'task_id' });
    Proposal.belongsTo(models.User, { as: 'author', foreignKey: 'author_id' });
    Proposal.belongsTo(models.User, { as: 'validatorUser', foreignKey: 'validator_id' });
    Proposal.hasMany(models.ProposalComment, { as: 'comments', foreignKey: 'proposal_id' });
    Proposal.hasMany(models.Validation, { as: 'validations', foreignKey: 'proposal_id' });
    Proposal.hasMany(models.Publication, { as: 'publications', foreignKey: 'proposal_id' });
    Proposal.hasMany(models.ProposalAttachment, { as: 'attachments', foreignKey: 'proposal_id' });
  };

  return Proposal;
};
