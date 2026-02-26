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
  resolveTenantId(user, tenantId, bodyOrgId = null) {
    if (user.user_type === 'client') return user.organization_id;
    return tenantId || bodyOrgId || null;
  }

  getPublisherFromSession(user) {
    const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim();
    return fullName || user?.email || 'Utilisateur';
  }

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

  computeNetworks({ networks, networkLinks }) {
    const explicitNetworks = Array.isArray(networks)
      ? networks.map((n) => String(n).trim().toLowerCase()).filter((n) => VALID_NETWORKS.has(n))
      : [];
    const fromLinks = Object.keys(networkLinks || {});
    return Array.from(new Set([...explicitNetworks, ...fromLinks]));
  }

  async normalizeTaskLink(payload, tenantId) {
    if (!payload.task_id) return payload;
    const task = await Task.findByPk(payload.task_id, { attributes: ['id', 'project_id', 'organization_id', 'title'] });
    if (!task) throw ApiError.notFound('Task');
    if (tenantId && task.organization_id !== tenantId) {
      throw ApiError.forbidden('Task does not belong to selected organization');
    }
    payload.organization_id = task.organization_id;
    payload.project_id = payload.project_id || task.project_id || null;
    return payload;
  }

  async list(filters, user) {
    const resolvedTenantId = this.resolveTenantId(user, filters.tenantId, filters.organizationId);
    return editorialRepository.findAll({
      tenantId: resolvedTenantId,
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

  async create(data, user, tenantId) {
    const resolvedTenantId = this.resolveTenantId(user, tenantId, data.organization_id);
    if (!resolvedTenantId) throw ApiError.badRequest('organization_id is required for internal users');

    const payload = {
      ...data,
      organization_id: resolvedTenantId,
      created_by: user.id,
      publisher_name: this.getPublisherFromSession(user),
      network_links: this.normalizeNetworkLinks(data.network_links),
      status: data.status || 'scheduled',
      channel: data.channel || 'other',
    };
    payload.networks = this.computeNetworks({ networks: data.networks, networkLinks: payload.network_links });

    if (!VALID_PUBLICATION_STATUS.has(payload.status)) payload.status = 'scheduled';
    if (!VALID_CHANNELS.has(payload.channel)) payload.channel = 'other';

    await this.normalizeTaskLink(payload, resolvedTenantId);

    if (payload.project_id) {
      const project = await Project.findByPk(payload.project_id, { attributes: ['id', 'organization_id'] });
      if (!project) throw ApiError.notFound('Project');
      if (project.organization_id !== resolvedTenantId) {
        throw ApiError.forbidden('Project does not belong to selected organization');
      }
    }

    return editorialRepository.create(payload);
  }

  async update(id, data, user, tenantId) {
    const resolvedTenantId = this.resolveTenantId(user, tenantId);
    const existing = await editorialRepository.findById(id, resolvedTenantId);
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

    await this.normalizeTaskLink(payload, existing.organization_id);

    if (payload.project_id) {
      const project = await Project.findByPk(payload.project_id, { attributes: ['id', 'organization_id'] });
      if (!project) throw ApiError.notFound('Project');
      if (project.organization_id !== existing.organization_id) {
        throw ApiError.forbidden('Project does not belong to selected organization');
      }
    }

    return editorialRepository.update(id, payload);
  }

  async assignTask(id, taskId, user, tenantId) {
    const resolvedTenantId = this.resolveTenantId(user, tenantId);
    const existing = await editorialRepository.findById(id, resolvedTenantId);
    if (!existing) throw ApiError.notFound('Editorial publication');

    const task = await Task.findByPk(taskId, { attributes: ['id', 'title', 'project_id', 'organization_id'] });
    if (!task) throw ApiError.notFound('Task');
    if (task.organization_id !== existing.organization_id) {
      throw ApiError.forbidden('Task does not belong to same organization');
    }

    return editorialRepository.update(id, {
      task_id: task.id,
      project_id: task.project_id,
    });
  }

  async importExcel(fileBuffer, user, tenantId, organizationId = null) {
    const rows = await parseEditorialImport(fileBuffer);
    if (!rows.length) return { imported: 0, skipped: 0 };

    const resolvedTenantId = this.resolveTenantId(user, tenantId, organizationId);
    if (!resolvedTenantId) throw ApiError.badRequest('organization_id is required for internal users');

    const toInsert = [];
    let skipped = 0;

    for (const row of rows) {
      if (!row.publication_date && !row.task_id && !row.notes) {
        skipped += 1;
        continue;
      }

      const normalizedLinks = this.normalizeNetworkLinks(row.network_links || {});
      const payload = {
        organization_id: resolvedTenantId,
        publication_date: row.publication_date,
        publisher_name: this.getPublisherFromSession(user),
        network_links: normalizedLinks,
        networks: this.computeNetworks({ networks: row.networks || [], networkLinks: normalizedLinks }),
        status: VALID_PUBLICATION_STATUS.has(row.status) ? row.status : 'scheduled',
        channel: VALID_CHANNELS.has(row.channel) ? row.channel : 'other',
        notes: row.notes,
        project_id: row.project_id || null,
        created_by: user.id,
      };

      if (row.task_id) {
        const task = await Task.findByPk(row.task_id, { attributes: ['id', 'title', 'project_id', 'organization_id'] });
        if (!task || task.organization_id !== resolvedTenantId) {
          skipped += 1;
          continue;
        }
        payload.task_id = task.id;
        payload.project_id = payload.project_id || task.project_id || null;
      }

      toInsert.push(payload);
    }

    if (toInsert.length) await editorialRepository.bulkCreate(toInsert);
    return { imported: toInsert.length, skipped };
  }

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

