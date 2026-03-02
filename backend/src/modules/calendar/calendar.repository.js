'use strict';

const { CalendarEvent } = require('../../models');
const { Op } = require('sequelize');

class CalendarRepository {
  /* Récupère tous les événements du calendrier avec filtres */
  async findAll({ status, startDate, endDate, search, page, limit, offset } = {}) {
    const where = {};

    if (status) where.status = status;
    if (startDate && endDate) {
      where.start_date = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    } else if (startDate) {
      where.start_date = { [Op.gte]: new Date(startDate) };
    } else if (endDate) {
      where.start_date = { [Op.lte]: new Date(endDate) };
    }
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { rows, count } = await CalendarEvent.findAndCountAll({
      where,
      include: [
        { association: 'creator', attributes: ['id', 'first_name', 'last_name'] },
        { association: 'agency', attributes: ['id', 'name', 'code'] },
        { association: 'direction', attributes: ['id', 'name', 'code'] },
      ],
      order: [['start_date', 'ASC']],
      limit,
      offset,
    });

    return { data: rows, total: count };
  }

  /* Récupère un événement par son ID */
  async findById(id) {
    const where = { id };

    return CalendarEvent.findOne({
      where,
      include: [
        { association: 'creator', attributes: ['id', 'first_name', 'last_name'] },
        { association: 'agency', attributes: ['id', 'name', 'code'] },
        { association: 'direction', attributes: ['id', 'name', 'code'] },
      ],
    });
  }

  /* Crée un événement */
  async create(data) {
    return CalendarEvent.create(data);
  }

  /* Crée plusieurs événements en masse */
  async bulkCreate(items) {
    return CalendarEvent.bulkCreate(items);
  }

  /* Met à jour un événement */
  async update(id, data) {
    const event = await CalendarEvent.findByPk(id);
    if (!event) return null;
    return event.update(data);
  }

  /* Met à jour le statut d'un événement */
  async updateStatus(id, status) {
    const event = await CalendarEvent.findByPk(id);
    if (!event) return null;
    return event.update({ status });
  }

  /* Supprime un événement */
  async delete(id) {
    const event = await CalendarEvent.findByPk(id);
    if (!event) return null;
    await event.destroy();
    return event;
  }
}

module.exports = new CalendarRepository();
