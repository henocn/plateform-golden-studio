const taskService = require('./task.service');

(async () => {
  try {
    await taskService.sendDeadlineReminders();
    console.log('Rappels de tâches envoyés.');
  } catch (err) {
    console.error('Erreur lors de l\'envoi des rappels :', err);
  }
})();
