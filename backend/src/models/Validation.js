'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Validation = sequelize.define('Validation', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    proposal_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    validator_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('approved', 'needs_revision', 'rejected'),
      allowNull: false,
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    validated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'validations',
    timestamps: true,
    updatedAt: false,
    underscored: true,
  });

  Validation.associate = (models) => {
    Validation.belongsTo(models.Proposal, { as: 'proposal', foreignKey: 'proposal_id' });
    Validation.belongsTo(models.User, { as: 'validator', foreignKey: 'validator_id' });
  };

  return Validation;
};
