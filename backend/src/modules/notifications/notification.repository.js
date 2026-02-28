'use strict';

const { Notification, User } = require('../../models');
const { Op } = require('sequelize');


// ═══════════════════════════════════════════════════
//            NotificationRepository
// ═══════════════════════════════════════════════════


class NotificationRepository {
  /* Crée une notification en base */
  async create(data) {
    return Notification.create(data);
  }

  /* Crée plusieurs notifications en une seule requête */
  async bulkCreate(items) {
    return Notification.bulkCreate(items);
  }

  /* Récupère les notifications d'un utilisateur avec pagination */
  async findByUser(userId, { limit = 50, offset = 0, unreadOnly = false } = {}) {
    const where = { user_id: userId };
    if (unreadOnly) where.is_read = false;

    const { rows, count } = await Notification.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return { data: rows, total: count };
  }

  /* Compte les notifications non lues */
  async countUnread(userId) {
    return Notification.count({ where: { user_id: userId, is_read: false } });
  }

  /* Marque une notification comme lue */
  async markAsRead(id, userId) {
    const notif = await Notification.findOne({ where: { id, user_id: userId } });
    if (!notif) return null;
    return notif.update({ is_read: true, read_at: new Date() });
  }

  /* Marque toutes les notifications d'un utilisateur comme lues */
  async markAllAsRead(userId) {
    return Notification.update(
      { is_read: true, read_at: new Date() },
      { where: { user_id: userId, is_read: false } },
    );
  }

  /* Supprime une notification */
  async delete(id, userId) {
    const notif = await Notification.findOne({ where: { id, user_id: userId } });
    if (!notif) return null;
    await notif.destroy();
    return notif;
  }

  /* Vérifie si une notification similaire existe déjà (évite les doublons pour les crons) */
  async exists({ userId, type, referenceId, afterDate }) {
    const where = {
      user_id: userId,
      type,
      reference_id: referenceId,
    };
    if (afterDate) {
      where.created_at = { [Op.gte]: afterDate };
    }
    const count = await Notification.count({ where });
    return count > 0;
  }

  /* Récupère les utilisateurs ayant un rôle spécifique */
  async findUsersByRoles(roles) {
    return User.findAll({
      where: {
        role: { [Op.in]: roles },
        is_active: true,
      },
      attributes: ['id', 'first_name', 'last_name', 'email', 'role'],
    });
  }
}

module.exports = new NotificationRepository();
