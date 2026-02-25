'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProposalAttachment = sequelize.define('ProposalAttachment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    proposal_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    file_path: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    file_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  }, {
    tableName: 'proposal_attachments',
    timestamps: true,
    underscored: true,
  });

  ProposalAttachment.associate = (models) => {
    ProposalAttachment.belongsTo(models.Proposal, { foreignKey: 'proposal_id' });
  };

  return ProposalAttachment;
};
