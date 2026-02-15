'use strict';

const { Brief, BriefAttachment, User, Organization } = require('../../models');

class BriefRepository {
  /**
   * Find briefs for a project (optionally scoped by tenant)
   */
  async findByProject(projectId, tenantId = null) {
    const where = { project_id: projectId };
    if (tenantId) where.organization_id = tenantId;

    return Brief.findAll({
      where,
      include: [
        { association: 'submitter', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { association: 'attachments' },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  async findById(id, tenantId = null) {
    const where = { id };
    if (tenantId) where.organization_id = tenantId;

    return Brief.findOne({
      where,
      include: [
        { association: 'project', attributes: ['id', 'title'] },
        { association: 'organization', attributes: ['id', 'name'] },
        { association: 'submitter', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { association: 'attachments', include: [{ association: 'uploader', attributes: ['id', 'first_name', 'last_name'] }] },
      ],
    });
  }

  async create(data) {
    return Brief.create(data);
  }

  async update(id, data, tenantId = null) {
    const where = { id };
    if (tenantId) where.organization_id = tenantId;

    const brief = await Brief.findOne({ where });
    if (!brief) return null;
    return brief.update(data);
  }

  async createAttachment(data) {
    return BriefAttachment.create(data);
  }

  async findAttachmentById(attachId) {
    return BriefAttachment.findByPk(attachId);
  }

  async deleteAttachment(attachId) {
    const attachment = await BriefAttachment.findByPk(attachId);
    if (!attachment) return null;
    await attachment.destroy();
    return attachment;
  }
}

module.exports = new BriefRepository();
