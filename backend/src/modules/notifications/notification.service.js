'use strict';

const notificationRepository = require('./notification.repository');
const PERMISSIONS = require('../../config/permissions');
const NOTIFICATIONS_CONFIG = require('../../config/notifications');
const logger = require('../../utils/logger');
const sendEmail = require('../../utils/sendEmail');
const { buildNotificationEmail } = require('../../utils/emailTemplates');


// ═══════════════════════════════════════════════════
//              NotificationService (emails only)
// ═══════════════════════════════════════════════════


class NotificationService {
  /* Envoie une notification (email uniquement) à un utilisateur */
  async notify({ userId, type, title, message, referenceId, referenceType, link }) {
    await this._sendNotificationEmails([userId], {
      type,
      title,
      message,
      link,
      referenceId,
      referenceType,
    }).catch((err) => {
      logger.error('[Notification] Email non envoyé', { userId, error: err.message });
    });
    return null;
  }

  /* Envoie une notification (email uniquement) à plusieurs utilisateurs */
  async notifyMany(userIds, { type, title, message, referenceId, referenceType, link }) {
    const uniqueIds = [...new Set(userIds)];
    await this._sendNotificationEmails(uniqueIds, {
      type,
      title,
      message,
      link,
      referenceId,
      referenceType,
    }).catch((err) => {
      logger.error('[Notification] Emails non envoyés', { userIds: uniqueIds, error: err.message });
    });
    return null;
  }

  /* Envoie un email par destinataire pour une notification (template enrichi et stylé) */
  async _sendNotificationEmails(userIds, { type, title, message, link, referenceId, referenceType }) {
    const users = await notificationRepository.findEmailsByIds(userIds);
    const env = require('../../config/env');
    const baseUrl = env.FRONTEND_URL || env.APP_URL || 'http://localhost:5173';

    const config = NOTIFICATIONS_CONFIG[type] || { email: true };
    if (!config.email) return;

    const details = await this._buildEmailDetails({ type, referenceId, referenceType });
    const { html, text } = buildNotificationEmail({ title, message, link, details }, baseUrl);

    for (const user of users) {
      if (!user.email) continue;
      const prefs = user.notification_settings || {};
      const emailPrefKey = config.emailPreferenceKey || 'email_enabled';
      const domainPrefKey = config.domainPreferenceKey;

      // Global désactivation des emails
      if (prefs[emailPrefKey] === false) continue;
      // Désactivation par domaine (tâches, événements, etc.)
      if (domainPrefKey && prefs[domainPrefKey] === false) continue;

      await sendEmail({
        to: user.email,
        subject: title || 'Notification',
        html,
        text,
      });
    }
  }

  /* Construit une liste de détails “raisonnables” selon le type de référence */
  async _buildEmailDetails({ type, referenceId, referenceType }) {
    const details = [];
    details.push({
      label: 'Créé le',
      value: new Date().toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }),
    });

    if (!referenceId || !referenceType) return details;

    try {
      const { Task, CalendarEvent, Publication, Project } = require('../../models');

      if (referenceType === 'calendar_event') {
        const event = await CalendarEvent.findByPk(referenceId, {
          attributes: ['id', 'title', 'description', 'start_date', 'end_date', 'status', 'created_at'],
        });
        if (event) {
          if (event.title) details.push({ label: 'Titre', value: event.title });
          if (event.start_date) details.push({ label: 'Début', value: new Date(event.start_date).toLocaleString('fr-FR') });
          if (event.end_date) details.push({ label: 'Fin', value: new Date(event.end_date).toLocaleString('fr-FR') });
          if (event.description) details.push({ label: 'Description', value: this._truncate(event.description, 280) });
        }
      } else if (referenceType === 'task') {
        const task = await Task.findByPk(referenceId, {
          attributes: ['id', 'title', 'description', 'due_date', 'status', 'created_at'],
        });
        if (task) {
          if (task.title) details.push({ label: 'Tâche', value: task.title });
          if (task.due_date) details.push({ label: 'Date limite', value: task.due_date });
          if (task.description) details.push({ label: 'Description', value: this._truncate(task.description, 280) });
        }
      } else if (referenceType === 'publication') {
        const pub = await Publication.findByPk(referenceId, {
          attributes: ['id', 'publication_title', 'notes', 'publication_date', 'status', 'created_at'],
        });
        if (pub) {
          if (pub.publication_title) details.push({ label: 'Titre', value: pub.publication_title });
          if (pub.publication_date) details.push({ label: 'Date de publication', value: pub.publication_date });
          if (pub.notes) details.push({ label: 'Notes', value: this._truncate(pub.notes, 280) });
        }
      } else if (referenceType === 'project') {
        const project = await Project.findByPk(referenceId, { attributes: ['id', 'title', 'created_at'] });
        if (project?.title) details.push({ label: 'Projet', value: project.title });
      }
    } catch (err) {
      logger.error('[Notification] buildEmailDetails error', { type, referenceType, referenceId, error: err?.message });
    }

    return details;
  }

  _truncate(str, max) {
    const s = String(str || '');
    if (s.length <= max) return s;
    return `${s.slice(0, max - 1)}…`;
  }

  /* Liste les notifications d'un utilisateur */
  async list(userId, { page = 1, limit = 50, unreadOnly = false } = {}) {
    // Système de notifications en base supprimé : toujours vide
    return { data: [], total: 0 };
  }

  /* Compte les non lues */
  async countUnread(userId) {
    return 0;
  }

  /* Marque une notification comme lue */
  async markAsRead(notifId, userId) {
    return null;
  }

  /* Marque toutes les notifications comme lues */
  async markAllAsRead(userId) {
    return null;
  }

  /* Supprime une notification */
  async delete(notifId, userId) {
    return null;
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
