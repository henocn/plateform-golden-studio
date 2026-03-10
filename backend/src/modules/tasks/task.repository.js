"use strict";

const {
  Task,
  TaskComment,
  Proposal,
  User,
  Project,
} = require("../../models");
const { Op } = require("sequelize");

class TaskRepository {
  /* Récupère toutes les tâches avec filtres et visibilité */
  async findAll({
    projectId,
    assigneeId,
    status,
    overdue,
    urgent,
    search,
    page,
    limit,
    offset,
  } = {}) {
    const where = {};

    if (projectId) where.project_id = projectId;
    if (assigneeId) where.assigned_to = assigneeId;
    if (status) where.status = status;
    if (urgent === "true" || urgent === true) where.priority = "urgent";
    if (overdue === "true" || overdue === true) {
      where.due_date = { [Op.lt]: new Date() };
      where.status = { [Op.notIn]: ["done", "cancelled"] };
    }
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { rows, count } = await Task.findAndCountAll({
      where,
      include: [
        {
          association: "project",
          attributes: ["id", "title", "client_contact_id"],
          include: [
            {
              association: "clientContact",
              attributes: ["id", "first_name", "last_name", "email"],
            },
          ],
        },
        {
          association: "assignee",
          attributes: ["id", "first_name", "last_name", "email"],
        },
        {
          association: "creator",
          attributes: ["id", "first_name", "last_name", "email"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit,
      offset,
    });

    return { data: rows, total: count };
  }

  /* Récupère une tâche par son ID */
  async findById(id) {
    const where = { id };

    return Task.findOne({
      where,
      include: [
        {
          association: "project",
          attributes: ["id", "title", "client_contact_id"],
          include: [
            {
              association: "clientContact",
              attributes: ["id", "first_name", "last_name", "email"],
            },
          ],
        },
        {
          association: "assignee",
          attributes: ["id", "first_name", "last_name", "email"],
        },
        {
          association: "creator",
          attributes: ["id", "first_name", "last_name", "email"],
        },
        {
          association: "supervisor",
          attributes: ["id", "first_name", "last_name", "email"],
        },
      ],
    });
  }

  /* Récupère les propositions liées à une tâche */
  async findProposals(taskId) {
    const where = { task_id: taskId };
    return Proposal.findAll({
      where,
      include: [
        { association: 'author', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { association: 'project', attributes: ['id', 'title'] },
        { association: 'attachments', order: [['sort_order', 'ASC']] },
        {
          association: 'comments',
          order: [['created_at', 'ASC']],
          include: [
            { association: 'author', attributes: ['id', 'first_name', 'last_name'] },
          ],
        },
        {
          association: 'validations',
          order: [['validated_at', 'DESC']],
          include: [
            { association: 'validator', attributes: ['id', 'first_name', 'last_name'] },
          ],
        },
      ],
      order: [['version_number', 'DESC']],
    });
  }

  /* Crée une tâche */
  async create(data) {
    return Task.create(data);
  }

  /* Met à jour une tâche */
  async update(id, data) {
    const task = await Task.findByPk(id);
    if (!task) return null;
    return task.update(data);
  }

  /* Met à jour le statut d'une tâche */
  async updateStatus(id, status) {
    const task = await Task.findByPk(id);
    if (!task) return null;
    return task.update({ status });
  }

  /* Supprime une tâche */
  async delete(id) {
    const task = await Task.findByPk(id);
    if (!task) return null;
    await task.destroy();
    return task;
  }

  // ─── Comments ────────────────────────────────────────────────

  /* Récupère les commentaires d'une tâche */
  async findComments(taskId, { isClient = false } = {}) {
    const where = { task_id: taskId };
    if (isClient) where.is_internal = false;

    return TaskComment.findAll({
      where,
      include: [
        {
          association: "author",
          attributes: ["id", "first_name", "last_name", "user_type"],
        },
      ],
      order: [["created_at", "ASC"]],
    });
  }

  /* Crée un commentaire sur une tâche */
  async createComment(data) {
    return TaskComment.create(data);
  }

  /* Récupère un commentaire par son ID */
  async findCommentById(commentId) {
    return TaskComment.findByPk(commentId);
  }

  /* Supprime un commentaire */
  async deleteComment(commentId) {
    const comment = await TaskComment.findByPk(commentId);
    if (!comment) return null;
    await comment.destroy();
    return comment;
  }
}

module.exports = new TaskRepository();
