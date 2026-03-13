'use strict';

const calendarRepository = require('./calendar.repository');
const ApiError = require('../../utils/ApiError');
const { parseEventsImport, buildEventsExport } = require('./calendar.excel.utils');
const notificationRepository = require('../notifications/notification.repository');
const notificationService = require('../notifications/notification.service');
const taskRepository = require('../tasks/task.repository');
const taskService = require('../tasks/task.service');
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

    // Crée des tâches (model Task) pour les tâches d'événement éventuelles (templates)
    try {
      const tasks = Array.isArray(data.tasks) ? data.tasks : [];
      const payloads = tasks
        .filter((t) => t && t.title)
        .map((t) => ({
          title: `${event.title} - ${t.title}`,
          description: t.description || null,
          assigned_to: t.responsible_user_id || null,
          supervisor_id: t.supervisor_id || null,
          due_date: t.due_date || null,
          publication_date: t.publication_date || event.start_date || null,
          priority: t.priority || 'normal',
          status: 'todo',
          context: 'event',
          event_id: event.id,
          created_by: user.id,
          is_configured: Boolean(t.supervisor_id && t.due_date),
        }));

      for (const payload of payloads) {
        await taskService.create(payload, user);
      }
    } catch (err) {
      logger.error('[Calendar] Erreur lors de la création des tâches liées à un événement', {
        eventId: event.id,
        error: err.message,
      });
    }

    // Envoie un message WhatsApp aux numéros configurés pour signaler la création de l'événement
    try {
      await whatsapp.sendEventCreatedNotification(event);
    } catch (err) {
      logger.error('[Calendar :] Erreur lors de l’envoi WhatsApp pour la création d’événement', {
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
