'use strict';

const { CalendarEvent } = require('../../models');
const { Op } = require('sequelize');

class CalendarRepository {
  async findAll({ tenantId, type, projectId, status, visibility, startDate, endDate, search, page, limit, offset } = {}) {
    const where = {};

    if (tenantId) where.organization_id = tenantId;
    if (type) where.type = type;
    if (projectId) where.project_id = projectId;
    if (status) where.status = status;
    if (visibility) where.visibility = visibility;
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
        { association: 'organization', attributes: ['id', 'name'] },
        { association: 'project', attributes: ['id', 'title'] },
        { association: 'creator', attributes: ['id', 'first_name', 'last_name'] },
      ],
      order: [['start_date', 'ASC']],
      limit,
      offset,
    });

    return { data: rows, total: count };
  }

  async findById(id, tenantId = null) {
    const where = { id };
    if (tenantId) where.organization_id = tenantId;

    return CalendarEvent.findOne({
      where,
      include: [
        { association: 'organization', attributes: ['id', 'name'] },
        { association: 'project', attributes: ['id', 'title'] },
        { association: 'creator', attributes: ['id', 'first_name', 'last_name'] },
      ],
    });
  }

  async create(data) {
    return CalendarEvent.create(data);
  }

  async bulkCreate(items) {
    return CalendarEvent.bulkCreate(items);
  }

  async update(id, data) {
    const event = await CalendarEvent.findByPk(id);
    if (!event) return null;
    return event.update(data);
  }

  async updateStatus(id, status) {
    const event = await CalendarEvent.findByPk(id);
    if (!event) return null;
    return event.update({ status });
  }

  async delete(id) {
    const event = await CalendarEvent.findByPk(id);
    if (!event) return null;
    await event.destroy();
    return event;
  }
}

module.exports = new CalendarRepository();
