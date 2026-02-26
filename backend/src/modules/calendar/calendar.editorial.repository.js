'use strict';

const { Op } = require('sequelize');
const { Publication } = require('../../models');

class CalendarEditorialRepository {
  async findAll({ tenantId, projectId, taskId, status, startDate, endDate, search, page, limit, offset }) {
    const where = {};
    if (tenantId) where.organization_id = tenantId;
    if (projectId) where.project_id = projectId;
    if (taskId) where.task_id = taskId;
    if (status) where.status = status;

    if (startDate && endDate) {
      where.publication_date = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    } else if (startDate) {
      where.publication_date = { [Op.gte]: new Date(startDate) };
    } else if (endDate) {
      where.publication_date = { [Op.lte]: new Date(endDate) };
    }

    if (search) {
      where[Op.or] = [
        { publication_title: { [Op.iLike]: `%${search}%` } },
        { publisher_name: { [Op.iLike]: `%${search}%` } },
        { notes: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { rows, count } = await Publication.findAndCountAll({
      where,
      include: [
        { association: 'project', attributes: ['id', 'title'] },
        { association: 'task', attributes: ['id', 'title', 'status', 'project_id'] },
        { association: 'creator', attributes: ['id', 'first_name', 'last_name'] },
      ],
      order: [['publication_date', 'ASC'], ['created_at', 'DESC']],
      limit,
      offset,
    });

    return { data: rows, total: count };
  }

  async findById(id, tenantId = null) {
    const where = { id };
    if (tenantId) where.organization_id = tenantId;
    return Publication.findOne({
      where,
      include: [
        { association: 'project', attributes: ['id', 'title'] },
        { association: 'task', attributes: ['id', 'title', 'status', 'project_id'] },
        { association: 'creator', attributes: ['id', 'first_name', 'last_name'] },
      ],
    });
  }

  async create(data) {
    return Publication.create(data);
  }

  async update(id, data) {
    const publication = await Publication.findByPk(id);
    if (!publication) return null;
    return publication.update(data);
  }

  async bulkCreate(items) {
    return Publication.bulkCreate(items);
  }
}

module.exports = new CalendarEditorialRepository();

