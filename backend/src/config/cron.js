'use strict';

const cron = require('node-cron');
const logger = require('../utils/logger');
const env = require('./env');


// ═══════════════════════════════════════════════════
//            Cron Jobs — Notifications
// ═══════════════════════════════════════════════════


/* Démarre les cron jobs de vérification des deadlines */
function startCronJobs() {
  cron.schedule('0 8 * * *', async () => {
    logger.info('[CRON] Vérification des deadlines publications & tâches…');
    try {
      await checkPublicationDeadlines();
      await checkTaskDeadlines();
      logger.info('[CRON] Vérification des deadlines terminée');
    } catch (err) {
      logger.error('[CRON] Erreur lors de la vérification des deadlines:', err);
    }
  });

  logger.info('Cron jobs initialized — deadline check every day at 08:00');
}

/* Vérifie les publications proches de leur date de publication */
async function checkPublicationDeadlines() {
  const { Publication } = require('../models');
  const { Op } = require('sequelize');
  const notificationService = require('../modules/notifications/notification.service');

  const firstDays = env.NOTIF_PUBLICATION_FIRST_WARNING_DAYS;
  const lastDays = env.NOTIF_PUBLICATION_LAST_WARNING_DAYS;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const publications = await Publication.findAll({
    where: {
      status: { [Op.notIn]: ['published', 'archived'] },
      publication_date: { [Op.not]: null },
    },
  });

  for (const pub of publications) {
    const pubDate = new Date(pub.publication_date);
    pubDate.setHours(0, 0, 0, 0);
    const diffMs = pubDate.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === lastDays) {
      await notificationService.onPublicationDeadlineWarning(pub, diffDays, true);
    } else if (diffDays === firstDays) {
      await notificationService.onPublicationDeadlineWarning(pub, diffDays, false);
    }
  }
}

/* Vérifie les tâches proches de leur due_date */
async function checkTaskDeadlines() {
  const { Task } = require('../models');
  const { Op } = require('sequelize');
  const notificationService = require('../modules/notifications/notification.service');

  const firstDays = env.NOTIF_TASK_FIRST_WARNING_DAYS;
  const lastDays = env.NOTIF_TASK_LAST_WARNING_DAYS;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tasks = await Task.findAll({
    where: {
      status: { [Op.notIn]: ['done', 'cancelled'] },
      due_date: { [Op.not]: null },
      assigned_to: { [Op.not]: null },
    },
  });

  for (const task of tasks) {
    const dueDate = new Date(task.due_date);
    dueDate.setHours(0, 0, 0, 0);
    const diffMs = dueDate.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === lastDays) {
      await notificationService.onTaskDeadlineWarning(task, diffDays, true);
    } else if (diffDays === firstDays) {
      await notificationService.onTaskDeadlineWarning(task, diffDays, false);
    }
  }
}

module.exports = { startCronJobs };
