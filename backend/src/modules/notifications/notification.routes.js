'use strict';

const router = require('express').Router();
const ctrl = require('./notification.controller');
const { authenticate } = require('../../middlewares/auth.middleware');


// ═══════════════════════════════════════════════════
//              Notification Routes
// ═══════════════════════════════════════════════════


router.use(authenticate);

/* Liste paginée des notifications */
router.get('/', ctrl.list);

/* Nombre de notifications non lues */
router.get('/unread-count', ctrl.unreadCount);

/* Marque toutes les notifications comme lues */
router.patch('/read-all', ctrl.markAllAsRead);

/* Marque une notification comme lue */
router.patch('/:id/read', ctrl.markAsRead);

/* Supprime une notification */
router.delete('/:id', ctrl.remove);

module.exports = router;
