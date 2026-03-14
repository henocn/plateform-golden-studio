'use strict';

const eventTemplateRepository = require('./eventTemplate.repository');
const ApiError = require('../../utils/ApiError');

// Commentaire: logique métier pour les templates d'événements
class EventTemplateService {
  // Commentaire: liste tous les templates disponibles
  async list() {
    return eventTemplateRepository.findAll();
  }

  // Commentaire: récupère un template par id
  async getById(id) {
    const tpl = await eventTemplateRepository.findById(id);
    if (!tpl) throw ApiError.notFound('Template d’événement');
    return tpl;
  }

  // Commentaire: crée un nouveau template et l’associe au créateur
  async create(data, user) {
    return eventTemplateRepository.create({
      ...data,
      created_by: user.id,
    });
  }

  // Commentaire: met à jour un template existant
  async update(id, data) {
    const tpl = await eventTemplateRepository.update(id, data);
    if (!tpl) throw ApiError.notFound('Template d’événement');
    return tpl;
  }

  // Commentaire: supprime un template existant
  async delete(id) {
    const tpl = await eventTemplateRepository.delete(id);
    if (!tpl) throw ApiError.notFound('Template d’événement');
    return tpl;
  }
}

module.exports = new EventTemplateService();

