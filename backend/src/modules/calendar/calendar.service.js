'use strict';

const calendarRepository = require('./calendar.repository');
const ApiError = require('../../utils/ApiError');
const { parseEventsImport, buildEventsExport } = require('./calendar.excel.utils');
const notificationRepository = require('../notifications/notification.repository');
const notificationService = require('../notifications/notification.service');
const whatsapp = require('../../config/whatsapp');
const logger = require('../../utils/logger');

// Alias pour les statuts d'événements dans les imports Excel
const EVENT_STATUS_ALIASES = {
  'en attente': 'pending',
  en_attente: 'pending',
  pending: 'pending',
  attente: 'pending',
  'en cours': 'in_progress',
  en_cours: 'in_progress',
  in_progress: 'in_progress',
  cours: 'in_progress',
  terminé: 'done',
  terminée: 'done',
  done: 'done',
  fini: 'done',
  finie: 'done',
  'annulé': 'cancelled',
  'annulée': 'cancelled',
  cancelled: 'cancelled',
};

class CalendarService {
  /**
   * Liste les événements.
   */
  async list(filters, user) {
    return calendarRepository.findAll(filters);
  }

  /**
   * Récupère un événement par ID
   */
  async getById(id, user) {
    const event = await calendarRepository.findById(id);
    if (!event) throw ApiError.notFound('Événement de calendrier');
    return event;
  }

  /**
   * Crée un événement
   */
  async create(data, user) {
    const event = await calendarRepository.create({
      ...data,
      created_by: user.id,
    });
    // Notifie super_admin, admin et client_admin à la création d'un événement
    try {
      const rolesToNotify = ['super_admin', 'admin', 'client_admin'];
      const recipients = await notificationRepository.findUsersByRoles(rolesToNotify);
      const ids = recipients.map((u) => u.id);
      if (ids.length) {
        // On réutilise un type existant pour éviter de modifier l'ENUM en base
        await notificationService.notifyMany(ids, {
          type: 'task_deadline_warning',
          title: `Nouvel événement : "${event.title}"`,
          message: `Un nouvel événement a été créé pour le ${event.start_date?.toISOString().slice(0, 10) || ''}.`,
          referenceId: event.id,
          referenceType: 'calendar_event',
          link: '/calendar/events',
        });
      }
    } catch (err) {
      console.error('Erreur lors de la notification de création d’événement', err);
    }

    // Notifie les utilisateurs responsables de tâches de cet événement
    try {
      const tasks = Array.isArray(data.tasks) ? data.tasks : [];
      const byUser = new Map();

      for (const task of tasks) {
        if (!task || !task.responsible_user_id) continue;
        const userId = task.responsible_user_id;
        if (!byUser.has(userId)) byUser.set(userId, []);
        byUser.get(userId).push(task);
      }

      for (const [userId, userTasks] of byUser.entries()) {
        const lines = userTasks.map((t) => {
          const base = `- ${t.title || 'Tâche'}`;
          if (t.due_date) {
            return `${base} (date cible : ${new Date(t.due_date).toISOString().slice(0, 10)})`;
          }
          return base;
        });

        const messageLines = [
          `Une ou plusieurs tâches vous ont été assignées dans le cadre de l’événement « ${event.title} ».`,
          '',
          'Détail des tâches :',
          ...lines,
        ];

        logger.info('[Calendar] Notification tâches événement', {
          eventId: event.id,
          userId,
          tasks: userTasks.map((t) => t.title),
        });

        await notificationService.notify({
          userId,
          type: 'task_pending_validation', // type ENUM existant réutilisé pour rester compatible
          title: `Tâches d’événement assignées — « ${event.title} »`,
          message: messageLines.join('\n'),
          referenceId: event.id,
          referenceType: 'calendar_event',
          link: '/calendar/events',
        });
      }
    } catch (err) {
      logger.error('Erreur lors de la notification des tâches d’événement', { eventId: event.id, error: err.message });
    }

    // Envoie un message WhatsApp aux numéros configurés pour signaler la création de l'événement
    try {
      await whatsapp.sendEventCreatedNotification(event);
    } catch (err) {
      logger.error('Erreur lors de l’envoi WhatsApp pour la création d’événement', {
        eventId: event.id,
        error: err.message,
      });
    }

    return event;
  }

  async update(id, data) {
    const event = await calendarRepository.update(id, data);
    if (!event) throw ApiError.notFound('Événement de calendrier');
    return event;
  }

  async updateStatus(id, status) {
    const event = await calendarRepository.updateStatus(id, status);
    if (!event) throw ApiError.notFound('Événement de calendrier');
    return event;
  }

  async delete(id) {
    const event = await calendarRepository.delete(id);
    if (!event) throw ApiError.notFound('Événement de calendrier');
    return event;
  }

  /**
   * Import en masse depuis un fichier Excel
   */
  async importExcel(fileBuffer, user) {
    const rows = await parseEventsImport(fileBuffer);
    if (!rows.length) return { imported: 0, skipped: 0 };

    const toInsert = [];
    let skipped = 0;
    for (const row of rows) {
      if (!row.title || !row.start_date) {
        skipped += 1;
        continue;
      }
      toInsert.push({
        title: row.title,
        start_date: row.start_date,
        end_date: row.end_date,
        status: EVENT_STATUS_ALIASES[String(row.status || '').toLowerCase()] || 'pending',
        description: row.description,
        created_by: user.id,
      });
    }
    if (toInsert.length) await calendarRepository.bulkCreate(toInsert);
    return { imported: toInsert.length, skipped };
  }

  async exportExcel(filters, user) {
    const { data } = await this.list({
      ...filters,
      page: 1,
      limit: 5000,
      offset: 0,
    }, user);
    return buildEventsExport(data);
  }
}

module.exports = new CalendarService();
