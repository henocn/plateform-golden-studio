'use strict';

const { CalendarEventTemplate } = require('../../models');

// Commentaire: accès base de données pour les templates d'événements
class EventTemplateRepository {
  // Commentaire: liste tous les templates d'événement
  async findAll() {
    return CalendarEventTemplate.findAll({
      order: [['created_at', 'DESC']],
    });
  }

  // Commentaire: récupère un template d'événement par son id
  async findById(id) {
    return CalendarEventTemplate.findByPk(id);
  }

  // Commentaire: crée un nouveau template d'événement
  async create(data) {
    return CalendarEventTemplate.create(data);
  }

  // Commentaire: met à jour un template d'événement existant
  async update(id, data) {
    const template = await CalendarEventTemplate.findByPk(id);
    if (!template) return null;
    return template.update(data);
  }

  // Commentaire: supprime un template d'événement
  async delete(id) {
    const template = await CalendarEventTemplate.findByPk(id);
    if (!template) return null;
    await template.destroy();
    return template;
  }
}

module.exports = new EventTemplateRepository();

