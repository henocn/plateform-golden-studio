'use strict';

/**
 * Configuration centrale des types de notifications.
 * Permet de définir quels types envoient un email et quelles préférences utilisateur s'appliquent.
 */

const NOTIFICATIONS_CONFIG = {
  task_pending_validation: {
    email: true,
    inApp: true,
    emailPreferenceKey: 'email_enabled',
    domainPreferenceKey: 'tasks_enabled',
  },
  task_deadline_warning: {
    email: true,
    inApp: true,
    emailPreferenceKey: 'email_enabled',
    domainPreferenceKey: 'tasks_enabled',
  },
  publication_deadline_warning: {
    email: true,
    inApp: true,
    emailPreferenceKey: 'email_enabled',
    domainPreferenceKey: 'events_enabled',
  },
  event_task_assigned: {
    email: true,
    inApp: true,
    emailPreferenceKey: 'email_enabled',
    domainPreferenceKey: 'tasks_enabled',
  },
};

module.exports = NOTIFICATIONS_CONFIG;

