'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProposalComment = sequelize.define('ProposalComment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    proposal_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    organization_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { notEmpty: true },
    },
    is_internal: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  }, {
    tableName: 'proposal_comments',
    timestamps: true,
    updatedAt: false,
    underscored: true,
  });

  ProposalComment.associate = (models) => {
    ProposalComment.belongsTo(models.Proposal, { as: 'proposal', foreignKey: 'proposal_id' });
    ProposalComment.belongsTo(models.Organization, { as: 'organization', foreignKey: 'organization_id' });
    ProposalComment.belongsTo(models.User, { as: 'author', foreignKey: 'user_id' });
  };

  return ProposalComment;
};
