'use strict';

const taskRepository = require('./task.repository');
const ApiError = require('../../utils/ApiError');
const { Project } = require('../../models');

class TaskService {
  /**
   * List tasks — internal sees all, client only sees client_visible
   */
  async list(filters, user) {
    const isClient = user.user_type === 'client';
    if (isClient) {
      filters.visibility = 'client_visible';
      filters.tenantId = user.organization_id;
    }
    return taskRepository.findAll(filters);
  }

  async getById(id, user) {
    const isClient = user.user_type === 'client';
    const task = await taskRepository.findById(id, isClient ? user.organization_id : null);
    if (!task) throw ApiError.notFound('Task');
    // Client cannot see internal_only tasks
    if (isClient && task.visibility === 'internal_only') {
      throw ApiError.notFound('Task');
    }
    return task;
  }

  async getProposals(id, user) {
    const isClient = user.user_type === 'client';
    const proposals = await taskRepository.findProposals(id, isClient ? user.organization_id : null);
    return proposals;
  }

  /**
   * Create task — internal only, must link to existing project
   */
  async create(data, user) {
    const project = await Project.findByPk(data.project_id);
    if (!project) throw ApiError.notFound('Project');

    return taskRepository.create({
      ...data,
      organization_id: project.organization_id,
      created_by: user.id,
    });
  }

  async update(id, data) {
    const task = await taskRepository.update(id, data);
    if (!task) throw ApiError.notFound('Task');
    return task;
  }

  async updateStatus(id, status) {
    const task = await taskRepository.updateStatus(id, status);
    if (!task) throw ApiError.notFound('Task');
    return task;
  }

  async delete(id) {
    const task = await taskRepository.delete(id);
    if (!task) throw ApiError.notFound('Task');
    return task;
  }


  /**
   * Envoie un email de rappel 1 jour avant la date limite à l'assigné et au superviseur
   */
  async sendDeadlineReminders() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const after = new Date(tomorrow);
    after.setHours(23, 59, 59, 999);

    // Récupère toutes les tâches dont la date limite est demain
    const { data: tasks } = await require('./task.repository').findAll({
      overdue: false,
      status: 'todo',
      due_date: { [require('sequelize').Op.between]: [tomorrow, after] },
    });

    const sendEmail = require('../../utils/sendEmail');

    for (const task of tasks) {
      // Récupère l'assigné et le superviseur
      const assignee = task.assignee;
      const supervisor = task.creator;
      const emails = [];
      if (assignee && assignee.email) emails.push(assignee.email);
      if (supervisor && supervisor.email && supervisor.email !== assignee.email) emails.push(supervisor.email);

      if (emails.length > 0) {
        await sendEmail({
          to: emails.join(','),
          subject: `Rappel : tâche "${task.title}" à rendre demain`,
          html: `<p>La tâche <b>${task.title}</b> doit être rendue avant le <b>${task.due_date}</b>.</p><p>Description : ${task.description || ''}</p>`,
          text: `La tâche ${task.title} doit être rendue avant le ${task.due_date}.`,
        });
      }
    }
  }

  async listComments(taskId, user) {
    const isClient = user.user_type === 'client';
    return taskRepository.findComments(taskId, { isClient });
  }

  /**
   * Add comment — is_internal transmis par le front (sauf client)
   */
  async addComment(taskId, content, user, is_internal) {
    const task = await taskRepository.findById(taskId);
    if (!task) throw ApiError.notFound('Task');

    // Client cannot comment on internal_only tasks
    if (user.user_type === 'client' && task.visibility === 'internal_only') {
      throw ApiError.forbidden('Cannot comment on internal-only tasks');
    }

    // Un client ne peut jamais poster en interne
    const internalFlag = user.user_type === 'client' ? false : Boolean(is_internal);

    return taskRepository.createComment({
      task_id: taskId,
      organization_id: task.organization_id,
      user_id: user.id,
      content,
      is_internal: internalFlag,
    });
  }

  async deleteComment(commentId, userId) {
    const comment = await taskRepository.findCommentById(commentId);
    if (!comment) throw ApiError.notFound('Comment');
    if (comment.user_id !== userId) {
      throw ApiError.forbidden('You can only delete your own comments');
    }
    return taskRepository.deleteComment(commentId);
  }
}

module.exports = new TaskService();
