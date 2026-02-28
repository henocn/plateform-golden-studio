'use strict';

const router = require('express').Router();
const ctrl = require('./direction.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

router.use(authenticate);

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', authorize('settings.agencies_directions'), ctrl.create);
router.put('/:id', authorize('settings.agencies_directions'), ctrl.update);
router.delete('/:id', authorize('settings.agencies_directions'), ctrl.remove);

module.exports = router;
