'use strict';

const calendarRepository = require('./calendar.repository');
const ApiError = require('../../utils/ApiError');
const {
  parseEventsImport,
  buildEventsExport,
} = require('./calendar.excel.utils');

const VALID_EVENT_TYPES = new Set(['event_coverage', 'meeting', 'other']);
const VALID_EVENT_STATUS = new Set(['pending', 'validated', 'scheduled', 'published', 'cancelled']);
const VALID_EVENT_VISIBILITY = new Set(['internal_only', 'client_visible']);
const EVENT_TYPE_ALIASES = {
  evenement: 'event_coverage',
  'événement': 'event_coverage',
  event_coverage: 'event_coverage',
  reunion: 'meeting',
  'réunion': 'meeting',
  meeting: 'meeting',
  autre: 'other',
  autres: 'other',
  other: 'other',
};

class CalendarService {
  /**
   * Liste les événements — client ne voit que client_visible
   */
  async list(filters, user) {
    const isClient = user.user_type === 'client';
    if (isClient) {
      filters.visibility = 'client_visible';
    }
    return calendarRepository.findAll(filters);
  }

  /**
   * Récupère un événement par ID
   */
  async getById(id, user) {
    const isClient = user.user_type === 'client';
    const event = await calendarRepository.findById(id);
    if (!event) throw ApiError.notFound('Événement de calendrier');
    if (isClient && event.visibility === 'internal_only') {
      throw ApiError.notFound('Événement de calendrier');
    }
    return event;
  }

  /**
   * Crée un événement
   */
  async create(data, user) {
    return calendarRepository.create({
      ...data,
      created_by: user.id,
    });
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
        project_id: row.project_id || null,
        title: row.title,
        type: VALID_EVENT_TYPES.has(EVENT_TYPE_ALIASES[String(row.type || '').toLowerCase()])
          ? EVENT_TYPE_ALIASES[String(row.type || '').toLowerCase()]
          : 'other',
        start_date: row.start_date,
        end_date: row.end_date,
        status: VALID_EVENT_STATUS.has(row.status) ? row.status : 'pending',
        visibility: VALID_EVENT_VISIBILITY.has(row.visibility) ? row.visibility : 'client_visible',
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
