'use strict';

const ApiError = require('../../utils/ApiError');
const editorialRepository = require('./calendar.editorial.repository');
const { Task, Project } = require('../../models');
const {
  parseEditorialImport,
  buildEditorialExport,
} = require('./calendar.excel.utils');


const VALID_PUBLICATION_STATUS = new Set(['scheduled', 'published', 'draft', 'archived']);
const VALID_CHANNELS = new Set(['facebook', 'linkedin', 'official_release', 'website', 'tv', 'radio', 'other']);
const VALID_NETWORKS = new Set(['facebook', 'linkedin', 'instagram', 'youtube', 'x', 'tiktok', 'whatsapp', 'messenger', 'other']);


class CalendarEditorialService {
  /**
   * Retourne le nom du publisher à partir de la session utilisateur
   */
  getPublisherFromSession(user) {
    const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim();
    return fullName || user?.email || 'Utilisateur';
  }

  /**
   * Normalise les liens des réseaux sociaux
   */
  normalizeNetworkLinks(networkLinks) {
    const obj = networkLinks && typeof networkLinks === 'object' ? networkLinks : {};
    const cleaned = {};
    Object.entries(obj).forEach(([network, link]) => {
      const key = String(network || '').trim().toLowerCase();
      if (!VALID_NETWORKS.has(key)) return;
      const value = String(link || '').trim();
      if (!value) return;
      cleaned[key] = value;
    });
    return cleaned;
  }

  /**
   * Calcule la liste des réseaux à partir des networks explicites et des liens
   */
  computeNetworks({ networks, networkLinks }) {
    const explicitNetworks = Array.isArray(networks)
      ? networks.map((n) => String(n).trim().toLowerCase()).filter((n) => VALID_NETWORKS.has(n))
      : [];
    const fromLinks = Object.keys(networkLinks || {});
    return Array.from(new Set([...explicitNetworks, ...fromLinks]));
  }

  /**
   * Résout le lien vers une tâche et enrichit le payload avec project_id
   */
  async normalizeTaskLink(payload) {
    if (!payload.task_id) return payload;
    const task = await Task.findByPk(payload.task_id, { attributes: ['id', 'project_id', 'title'] });
    if (!task) throw ApiError.notFound('Tâche');
    payload.project_id = payload.project_id || task.project_id || null;
    return payload;
  }

  /**
   * Liste les publications éditoriales avec filtres
   */
  async list(filters, user) {
    return editorialRepository.findAll({
      projectId: filters.projectId,
      taskId: filters.taskId,
      status: filters.status,
      startDate: filters.startDate,
      endDate: filters.endDate,
      search: filters.search,
      page: filters.page,
      limit: filters.limit,
      offset: filters.offset,
    });
  }

  /**
   * Crée une publication éditoriale
   */
  async create(data, user) {
    const payload = {
      ...data,
      created_by: user.id,
      publisher_name: this.getPublisherFromSession(user),
      network_links: this.normalizeNetworkLinks(data.network_links),
      status: data.status || 'scheduled',
      channel: data.channel || 'other',
    };
    payload.networks = this.computeNetworks({ networks: data.networks, networkLinks: payload.network_links });

    if (!VALID_PUBLICATION_STATUS.has(payload.status)) payload.status = 'scheduled';
    if (!VALID_CHANNELS.has(payload.channel)) payload.channel = 'other';

    await this.normalizeTaskLink(payload);
    if (!payload.project_id) {
      throw ApiError.badRequest('Veuillez sélectionner une tâche publiée (ou un projet)');
    }

    if (payload.project_id) {
      const project = await Project.findByPk(payload.project_id, { attributes: ['id'] });
      if (!project) throw ApiError.notFound('Projet');
    }

    return editorialRepository.create(payload);
  }

  /**
   * Met à jour une publication éditoriale existante
   */
  async update(id, data, user) {
    const existing = await editorialRepository.findById(id);
    if (!existing) throw ApiError.notFound('Editorial publication');

    const payload = {
      ...data,
      network_links: data.network_links !== undefined
        ? this.normalizeNetworkLinks(data.network_links)
        : (existing.network_links || {}),
    };
    payload.networks = this.computeNetworks({
      networks: data.networks !== undefined ? data.networks : existing.networks,
      networkLinks: payload.network_links,
    });
    payload.publisher_name = existing.publisher_name || this.getPublisherFromSession(user);

    if (payload.status && !VALID_PUBLICATION_STATUS.has(payload.status)) payload.status = existing.status;
    if (payload.channel && !VALID_CHANNELS.has(payload.channel)) payload.channel = existing.channel;

    await this.normalizeTaskLink(payload);

    if (payload.project_id) {
      const project = await Project.findByPk(payload.project_id, { attributes: ['id'] });
      if (!project) throw ApiError.notFound('Projet');
    }

    return editorialRepository.update(id, payload);
  }

  /**
   * Assigne une tâche à une publication éditoriale
   */
  async assignTask(id, taskId, user) {
    const existing = await editorialRepository.findById(id);
    if (!existing) throw ApiError.notFound('Editorial publication');

    const task = await Task.findByPk(taskId, { attributes: ['id', 'title', 'project_id'] });
    if (!task) throw ApiError.notFound('Tâche');

    return editorialRepository.update(id, {
      task_id: task.id,
      project_id: task.project_id,
    });
  }

  /**
   * Import en masse depuis un fichier Excel (format allégé sans tâche ni projet)
   */
  async importExcel(fileBuffer, user) {
    const rows = await parseEditorialImport(fileBuffer);
    if (!rows.length) return { imported: 0, skipped: 0 };

    const toInsert = [];
    let skipped = 0;

    for (const row of rows) {
      if (!row.publication_title && !row.publication_date && !row.notes) {
        skipped += 1;
        continue;
      }

      const normalizedLinks = this.normalizeNetworkLinks(row.network_links || {});
      const payload = {
        publication_title: row.publication_title || null,
        publication_date: row.publication_date,
        publisher_name: this.getPublisherFromSession(user),
        network_links: normalizedLinks,
        networks: this.computeNetworks({ networks: row.networks || [], networkLinks: normalizedLinks }),
        status: 'scheduled',
        channel: 'other',
        notes: row.notes,
        created_by: user.id,
      };

      toInsert.push(payload);
    }

    if (toInsert.length) await editorialRepository.bulkCreate(toInsert);
    return { imported: toInsert.length, skipped };
  }

  /**
   * Export Excel des publications éditoriales
   */
  async exportExcel(filters, user) {
    const { data } = await this.list({
      ...filters,
      page: 1,
      limit: 5000,
      offset: 0,
    }, user);
    return buildEditorialExport(data);
  }
}

module.exports = new CalendarEditorialService();
