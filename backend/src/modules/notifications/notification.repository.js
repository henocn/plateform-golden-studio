'use strict';

const { User } = require('../../models');
const { Op } = require('sequelize');

// ═══════════════════════════════════════════════════
//            NotificationRepository (emails only)
// ═══════════════════════════════════════════════════

class NotificationRepository {
  /* Récupère les utilisateurs ayant un rôle spécifique */
  async findUsersByRoles(roles) {
    return User.findAll({
      where: {
        role: { [Op.in]: roles },
        is_active: true,
      },
      attributes: ['id', 'first_name', 'last_name', 'email', 'role', 'notification_settings'],
    });
  }

  /* Récupère les emails + préférences des utilisateurs par leurs IDs (pour envoi email) */
  async findEmailsByIds(userIds) {
    if (!userIds?.length) return [];
    const users = await User.findAll({
      where: { id: { [Op.in]: [...new Set(userIds)] } },
      attributes: ['id', 'email', 'notification_settings'],
    });
    return users.filter((u) => u.email);
  }
}

module.exports = new NotificationRepository();

