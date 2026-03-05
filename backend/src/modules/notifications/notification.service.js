'use strict';

const notificationRepository = require('./notification.repository');
const ApiError = require('../../utils/ApiError');
const PERMISSIONS = require('../../config/permissions');
const logger = require('../../utils/logger');
const sendEmail = require('../../utils/sendEmail');


// ═══════════════════════════════════════════════════
//              NotificationService
// ═══════════════════════════════════════════════════


class NotificationService {
  constructor() {
    this.io = null;
  }

  /* Injecte l'instance Socket.IO pour les émissions temps réel */
  setSocketIO(io) {
    this.io = io;
  }

  /* Émet une notification temps réel via Socket.IO */
  emitToUser(userId, notification) {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit('notification:new', notification);
  }

  /* Émet le compteur de non lus */
  async emitUnreadCount(userId) {
    if (!this.io) return;
    const count = await notificationRepository.countUnread(userId);
    this.io.to(`user:${userId}`).emit('notification:unread_count', count);
  }

  /* Crée et émet une notification à un utilisateur, et envoie un email */
  async notify({ userId, type, title, message, referenceId, referenceType, link }) {
    const notification = await notificationRepository.create({
      user_id: userId,
      type,
      title,
      message,
      reference_id: referenceId || null,
      reference_type: referenceType || null,
      link: link || null,
    });

    this.emitToUser(userId, notification);
    this.emitUnreadCount(userId);

    this._sendNotificationEmails([userId], { title, message, link }).catch((err) => {
      logger.error('[Notification] Email non envoyé', { userId, error: err.message });
    });

    return notification;
  }

  /* Crée et émet des notifications pour plusieurs utilisateurs, et envoie les emails */
  async notifyMany(userIds, { type, title, message, referenceId, referenceType, link }) {
    const uniqueIds = [...new Set(userIds)];
    const items = uniqueIds.map((uid) => ({
      user_id: uid,
      type,
      title,
      message,
      reference_id: referenceId || null,
      reference_type: referenceType || null,
      link: link || null,
    }));

    const notifications = await notificationRepository.bulkCreate(items);

    for (const uid of uniqueIds) {
      const userNotif = notifications.find((n) => n.user_id === uid);
      if (userNotif) this.emitToUser(uid, userNotif);
      this.emitUnreadCount(uid);
    }

    this._sendNotificationEmails(uniqueIds, { title, message, link }).catch((err) => {
      logger.error('[Notification] Emails non envoyés', { userIds: uniqueIds, error: err.message });
    });

    return notifications;
  }

  /* Envoie un email par destinataire pour une notification (appelé en parallèle, ne bloque pas) */
  async _sendNotificationEmails(userIds, { title, message, link }) {
    const users = await notificationRepository.findEmailsByIds(userIds);
    const env = require('../../config/env');
    const baseUrl = env.FRONTEND_URL || 'http://localhost:5173';
    const linkHtml = link ? `<p><a href="${baseUrl}${link}">Voir dans l'application</a></p>` : '';
    const html = `<p>${(message || '').replace(/\n/g, '<br>')}</p>${linkHtml}`;
    const text = message || '';

    for (const user of users) {
      if (user.email) {
        await sendEmail({
          to: user.email,
          subject: title || 'Notification',
          html,
          text,
        });
      }
    }
  }

  /* Liste les notifications d'un utilisateur */
  async list(userId, { page = 1, limit = 50, unreadOnly = false } = {}) {
    const offset = (page - 1) * limit;
    return notificationRepository.findByUser(userId, { limit, offset, unreadOnly });
  }

  /* Compte les non lues */
  async countUnread(userId) {
    return notificationRepository.countUnread(userId);
  }

  /* Marque une notification comme lue */
  async markAsRead(notifId, userId) {
    const notif = await notificationRepository.markAsRead(notifId, userId);
    if (!notif) throw ApiError.notFound('Notification');
    this.emitUnreadCount(userId);
    return notif;
  }

  /* Marque toutes les notifications comme lues */
  async markAllAsRead(userId) {
    await notificationRepository.markAllAsRead(userId);
    this.emitUnreadCount(userId);
  }

  /* Supprime une notification */
  async delete(notifId, userId) {
    const notif = await notificationRepository.delete(notifId, userId);
    if (!notif) throw ApiError.notFound('Notification');
    this.emitUnreadCount(userId);
    return notif;
  }

  // ─── Méthodes métier spécialisées ─────────────────────────

  /* Notifie les validateurs quand une tâche passe en statut "done" */
  async onTaskPendingValidation(task) {
    const validatorRoles = PERMISSIONS['proposals.validate'] || [];
    const validators = await notificationRepository.findUsersByRoles(validatorRoles);
    const validatorIds = validators.map((v) => v.id);

    if (!validatorIds.length) return;

    await this.notifyMany(validatorIds, {
      type: 'task_pending_validation',
      title: `Tâche à valider : "${task.title}"`,
      message: `La tâche "${task.title}" est terminée et attend une validation.`,
      referenceId: task.id,
      referenceType: 'task',
      link: `/tasks/${task.id}`,
    });
  }

  /* Notifie l'assigné d'une tâche quand sa deadline approche */
  async onTaskDeadlineWarning(task, daysRemaining, isLastWarning) {
    if (!task.assigned_to) return;

    const alreadySent = await notificationRepository.exists({
      userId: task.assigned_to,
      type: 'task_deadline_warning',
      referenceId: task.id,
      afterDate: this.startOfToday(),
    });
    if (alreadySent) return;

    const urgency = isLastWarning ? 'Dernier avertissement' : 'Premier avertissement';

    await this.notify({
      userId: task.assigned_to,
      type: 'task_deadline_warning',
      title: `${urgency} — Tâche "${task.title}"`,
      message: `La tâche "${task.title}" est prévue dans ${daysRemaining} jour(s). Assurez-vous qu'elle soit finalisée à temps.`,
      referenceId: task.id,
      referenceType: 'task',
      link: `/tasks/${task.id}`,
    });
  }

  /* Notifie le créateur d'une publication dont la date de publication approche */
  async onPublicationDeadlineWarning(publication, daysRemaining, isLastWarning) {
    if (!publication.created_by) return;

    const alreadySent = await notificationRepository.exists({
      userId: publication.created_by,
      type: 'publication_deadline_warning',
      referenceId: publication.id,
      afterDate: this.startOfToday(),
    });
    if (alreadySent) return;

    const urgency = isLastWarning ? 'Dernier avertissement' : 'Premier avertissement';
    const title = publication.publication_title || 'Publication';

    await this.notify({
      userId: publication.created_by,
      type: 'publication_deadline_warning',
      title: `${urgency} — "${title}"`,
      message: `La publication "${title}" est prévue dans ${daysRemaining} jour(s) et n'est pas encore publiée ou archivée.`,
      referenceId: publication.id,
      referenceType: 'publication',
      link: '/calendar/editorial',
    });
  }

  /* Retourne le début du jour en cours */
  startOfToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
}

module.exports = new NotificationService();
