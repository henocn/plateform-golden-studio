'use strict';

const taskRepository = require('./task.repository');
const ApiError = require('../../utils/ApiError');
const { Project } = require('../../models');

class TaskService {
  /**
   * Liste les tâches — client ne voit que client_visible
   */
  async list(filters, user) {
    const isClient = user.user_type === 'client';
    if (isClient) {
      filters.visibility = 'client_visible';
    }
    return taskRepository.findAll(filters);
  }

  /**
   * Récupère une tâche par ID
   */
  async getById(id, user) {
    const isClient = user.user_type === 'client';
    const task = await taskRepository.findById(id);
    if (!task) throw ApiError.notFound('Tâche');
    if (isClient && task.visibility === 'internal_only') {
      throw ApiError.notFound('Task');
    }
    return task;
  }

  /**
   * Récupère les propositions liées à une tâche
   */
  async getProposals(id, user) {
    const proposals = await taskRepository.findProposals(id);
    return proposals;
  }

  /**
   * Create task — internal only, must link to existing project
   */
  async create(data, user) {
    const project = await Project.findByPk(data.project_id);
    if (!project) throw ApiError.notFound('Projet');

    return taskRepository.create({
      ...data,
      created_by: user.id,
    });
  }

  async update(id, data) {
    const task = await taskRepository.update(id, data);
    if (!task) throw ApiError.notFound('Tâche');
    return task;
  }

  async updateStatus(id, status) {
    const task = await taskRepository.updateStatus(id, status);
    if (!task) throw ApiError.notFound('Tâche');
    if (status === 'done') {
      const notificationService = require('../notifications/notification.service');
      notificationService.onTaskPendingValidation(task).catch((err) => {
        const logger = require('../../utils/logger');
        logger.error('[Task] onTaskPendingValidation error', { taskId: id, error: err?.message });
      });
    }
    return task;
  }

  async delete(id) {
    const task = await taskRepository.delete(id);
    if (!task) throw ApiError.notFound('Tâche');
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
    const { buildTaskReminderEmail } = require('../../utils/emailTemplates');
    const env = require('../../config/env');
    const baseUrl = env.FRONTEND_URL || 'http://localhost:5173';

    for (const task of tasks) {
      const assignee = task.assignee;
      const supervisor = task.creator;
      const emails = [];
      if (assignee && assignee.email) emails.push(assignee.email);
      if (supervisor && supervisor.email && supervisor.email !== assignee?.email) emails.push(supervisor.email);

      if (emails.length > 0) {
        const { html, text } = buildTaskReminderEmail(
          {
            taskTitle: task.title,
            dueDate: task.due_date,
            description: task.description || '',
            link: `/tasks/${task.id}`,
          },
          baseUrl
        );
        await sendEmail({
          to: emails.join(','),
          subject: `Rappel : tâche « ${task.title} » à rendre demain`,
          html,
          text,
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
    if (!task) throw ApiError.notFound('Tâche');

    // Client cannot comment on internal_only tasks
    if (user.user_type === 'client' && task.visibility === 'internal_only') {
      throw ApiError.forbidden('Cannot comment on internal-only tasks');
    }

    // Un client ne peut jamais poster en interne
    const internalFlag = user.user_type === 'client' ? false : Boolean(is_internal);

    return taskRepository.createComment({
      task_id: taskId,
      user_id: user.id,
      content,
      is_internal: internalFlag,
    });
  }

  async deleteComment(commentId, userId) {
    const comment = await taskRepository.findCommentById(commentId);
    if (!comment) throw ApiError.notFound('Commentaire');
    if (comment.user_id !== userId) {
      throw ApiError.forbidden('Vous ne pouvez supprimer que vos propres commentaires');
    }
    return taskRepository.deleteComment(commentId);
  }
}

module.exports = new TaskService();
