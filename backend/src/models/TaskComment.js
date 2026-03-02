'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TaskComment = sequelize.define('TaskComment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    task_id: {
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
    tableName: 'task_comments',
    timestamps: true,
    underscored: true,
  });

  TaskComment.associate = (models) => {
    TaskComment.belongsTo(models.Task, { as: 'task', foreignKey: 'task_id' });
    TaskComment.belongsTo(models.User, { as: 'author', foreignKey: 'user_id' });
  };

  return TaskComment;
};
