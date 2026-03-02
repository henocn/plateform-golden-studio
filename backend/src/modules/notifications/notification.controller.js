'use strict';

const notificationService = require('./notification.service');
const ApiResponse = require('../../utils/ApiResponse');


// ═══════════════════════════════════════════════════
//            NotificationController
// ═══════════════════════════════════════════════════


/* Récupère la liste des notifications de l'utilisateur connecté */
const list = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, unread_only } = req.query;
    const result = await notificationService.list(req.user.id, {
      page: parseInt(page, 10),
      limit: Math.min(parseInt(limit, 10) || 50, 100),
      unreadOnly: unread_only === 'true',
    });
    return ApiResponse.paginated(res, {
      data: result.data,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total: result.total,
    });
  } catch (error) {
    return next(error);
  }
};

/* Récupère le nombre de notifications non lues */
const unreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.countUnread(req.user.id);
    return ApiResponse.success(res, { count });
  } catch (error) {
    return next(error);
  }
};

/* Marque une notification comme lue */
const markAsRead = async (req, res, next) => {
  try {
    const notif = await notificationService.markAsRead(req.params.id, req.user.id);
    return ApiResponse.success(res, notif, 'Notification marquée comme lue');
  } catch (error) {
    return next(error);
  }
};

/* Marque toutes les notifications comme lues */
const markAllAsRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user.id);
    return ApiResponse.success(res, null, 'Toutes les notifications marquées comme lues');
  } catch (error) {
    return next(error);
  }
};

/* Supprime une notification */
const remove = async (req, res, next) => {
  try {
    await notificationService.delete(req.params.id, req.user.id);
    return ApiResponse.success(res, null, 'Notification supprimée');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  list,
  unreadCount,
  markAsRead,
  markAllAsRead,
  remove,
};
