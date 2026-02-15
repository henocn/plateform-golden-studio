'use strict';

const calendarRepository = require('./calendar.repository');
const ApiError = require('../../utils/ApiError');

class CalendarService {
  /**
   * List events — client only sees client_visible for their org
   */
  async list(filters, user) {
    const isClient = user.user_type === 'client';
    if (isClient) {
      filters.visibility = 'client_visible';
      filters.tenantId = user.organization_id;
    }
    return calendarRepository.findAll(filters);
  }

  async getById(id, user) {
    const isClient = user.user_type === 'client';
    const event = await calendarRepository.findById(id, isClient ? user.organization_id : null);
    if (!event) throw ApiError.notFound('Calendar event');
    if (isClient && event.visibility === 'internal_only') {
      throw ApiError.notFound('Calendar event');
    }
    return event;
  }

  async create(data, user) {
    return calendarRepository.create({
      ...data,
      created_by: user.id,
    });
  }

  async update(id, data) {
    const event = await calendarRepository.update(id, data);
    if (!event) throw ApiError.notFound('Calendar event');
    return event;
  }

  async updateStatus(id, status) {
    const event = await calendarRepository.updateStatus(id, status);
    if (!event) throw ApiError.notFound('Calendar event');
    return event;
  }

  async delete(id) {
    const event = await calendarRepository.delete(id);
    if (!event) throw ApiError.notFound('Calendar event');
    return event;
  }
}

module.exports = new CalendarService();
