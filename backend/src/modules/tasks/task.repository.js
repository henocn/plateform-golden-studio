"use strict";

const {
  Task,
  TaskComment,
  Proposal,
  User,
  Organization,
  Project,
} = require("../../models");
const { Op } = require("sequelize");

class TaskRepository {
  /**
   * Find all tasks with filters and visibility filtering
   */
  async findAll({
    tenantId,
    projectId,
    assigneeId,
    status,
    overdue,
    urgent,
    visibility,
    search,
    page,
    limit,
    offset,
  } = {}) {
    const where = {};

    if (tenantId) where.organization_id = tenantId;
    if (projectId) where.project_id = projectId;
    if (assigneeId) where.assigned_to = assigneeId;
    if (status) where.status = status;
    if (visibility) where.visibility = visibility;
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
        { association: "organization", attributes: ["id", "name"] },
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

  async findById(id, tenantId = null) {
    const where = { id };
    if (tenantId) where.organization_id = tenantId;

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
        { association: "organization", attributes: ["id", "name"] },
        {
          association: "assignee",
          attributes: ["id", "first_name", "last_name", "email"],
        },
        {
          association: "creator",
          attributes: ["id", "first_name", "last_name", "email"],
        },
      ],
    });
  }

  async findProposals(taskId, tenantId = null) {
    const where = { task_id: taskId };
    if (tenantId) where.organization_id = tenantId;
    return Proposal.findAll({ where });
  }

  async create(data) {
    return Task.create(data);
  }

  async update(id, data) {
    const task = await Task.findByPk(id);
    if (!task) return null;
    return task.update(data);
  }

  async updateStatus(id, status) {
    const task = await Task.findByPk(id);
    if (!task) return null;
    return task.update({ status });
  }

  async delete(id) {
    const task = await Task.findByPk(id);
    if (!task) return null;
    await task.destroy();
    return task;
  }

  // ─── Comments ────────────────────────────────────────────────

  async findComments(taskId, { isClient = false } = {}) {
    const where = { task_id: taskId };
    // Clients only see non-internal comments
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

  async createComment(data) {
    return TaskComment.create(data);
  }

  async findCommentById(commentId) {
    return TaskComment.findByPk(commentId);
  }

  async deleteComment(commentId) {
    const comment = await TaskComment.findByPk(commentId);
    if (!comment) return null;
    await comment.destroy();
    return comment;
  }
}

module.exports = new TaskRepository();
