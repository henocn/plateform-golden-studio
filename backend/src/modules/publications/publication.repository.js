'use strict';

const { Publication, Project } = require('../../models');

class PublicationRepository {
  /* Récupère les publications d'un projet */
  async findByProject(projectId) {
    const where = { project_id: projectId };

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

  /* Récupère une publication par son ID */
  async findById(id) {
    const where = { id };

    return Publication.findOne({
      where,
      include: [
        { association: 'project', attributes: ['id', 'title'] },
        { association: 'proposal', attributes: ['id', 'title', 'version_number', 'task_id'] },
        { association: 'task', attributes: ['id', 'title', 'status'] },
        { association: 'creator', attributes: ['id', 'first_name', 'last_name'] },
      ],
    });
  }

  /* Crée une publication */
  async create(data) {
    return Publication.create(data);
  }

  /* Met à jour une publication */
  async update(id, data) {
    const pub = await Publication.findByPk(id);
    if (!pub) return null;
    return pub.update(data);
  }

  /* Supprime une publication */
  async delete(id) {
    const pub = await Publication.findByPk(id);
    if (!pub) return null;
    await pub.destroy();
    return pub;
  }
}

module.exports = new PublicationRepository();
