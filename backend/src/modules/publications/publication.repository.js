'use strict';

const { Publication, Project } = require('../../models');

class PublicationRepository {
  async findByProject(projectId, tenantId = null) {
    const where = { project_id: projectId };
    if (tenantId) where.organization_id = tenantId;

    return Publication.findAll({
      where,
      include: [
        { association: 'proposal', attributes: ['id', 'title', 'version_number', 'task_id'] },
        { association: 'task', attributes: ['id', 'title', 'status'] },
        { association: 'creator', attributes: ['id', 'first_name', 'last_name'] },
      ],
      order: [['publication_date', 'DESC']],
    });
  }

  async findById(id, tenantId = null) {
    const where = { id };
    if (tenantId) where.organization_id = tenantId;

    return Publication.findOne({
      where,
      include: [
        { association: 'project', attributes: ['id', 'title'] },
        { association: 'organization', attributes: ['id', 'name'] },
        { association: 'proposal', attributes: ['id', 'title', 'version_number', 'task_id'] },
        { association: 'task', attributes: ['id', 'title', 'status'] },
        { association: 'creator', attributes: ['id', 'first_name', 'last_name'] },
      ],
    });
  }

  async create(data) {
    return Publication.create(data);
  }

  async update(id, data) {
    const pub = await Publication.findByPk(id);
    if (!pub) return null;
    return pub.update(data);
  }

  async delete(id) {
    const pub = await Publication.findByPk(id);
    if (!pub) return null;
    await pub.destroy();
    return pub;
  }
}

module.exports = new PublicationRepository();
