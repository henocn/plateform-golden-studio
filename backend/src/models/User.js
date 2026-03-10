'use strict';

const { DataTypes } = require('sequelize');

const INTERNAL_ROLES = ['super_admin', 'admin', 'validator', 'contributor', 'reader'];
const CLIENT_ROLES = ['client_admin', 'client_validator', 'client_contributor', 'client_reader'];
const ALL_ROLES = [...INTERNAL_ROLES, ...CLIENT_ROLES];

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true,
      },
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    user_type: {
      type: DataTypes.ENUM('internal', 'client'),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM(...ALL_ROLES),
      allowNull: false,
    },
    job_title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    avatar_path: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    two_factor_secret: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    two_factor_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    notification_settings: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    defaultScope: {
      attributes: { exclude: ['password_hash', 'two_factor_secret'] },
    },
    scopes: {
      withPassword: {
        attributes: { include: ['password_hash'] },
      },
      withTwoFactor: {
        attributes: { include: ['two_factor_secret'] },
      },
    },
    validate: {
      roleMatchesType() {
        const isClientRole = this.role && this.role.startsWith('client_');
        if (this.user_type === 'internal' && isClientRole) {
          throw new Error('Internal users cannot have client roles');
        }
        if (this.user_type === 'client' && !isClientRole) {
          throw new Error('Client users must have client_* roles');
        }
      },
    },
  });

  // Full name virtual
  User.prototype.getFullName = function () {
    return `${this.first_name} ${this.last_name}`;
  };

  // Never return password_hash in JSON
  User.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.password_hash;
    delete values.two_factor_secret;
    return values;
  };

  User.associate = (models) => {
    User.belongsTo(models.User, { as: 'creator', foreignKey: 'created_by' });
    User.hasMany(models.RefreshToken, { as: 'refreshTokens', foreignKey: 'user_id' });
  };

  // Export constants
  User.INTERNAL_ROLES = INTERNAL_ROLES;
  User.CLIENT_ROLES = CLIENT_ROLES;
  User.ALL_ROLES = ALL_ROLES;

  return User;
};
