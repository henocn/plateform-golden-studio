'use strict';

const env = require('../config/env');

const APP_NAME = env.EMAIL_BRAND_NAME || 'Qidoo';

/* Styles inline pour compatibilité clients email */
const styles = {
  wrapper: 'margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;font-size:15px;line-height:1.6;color:#0f172a;',
  container: 'max-width:560px;margin:0 auto;padding:24px 16px;',
  card: 'background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;',
  header: 'background:#ffffff;color:#0f172a;padding:18px 24px;text-align:center;border-bottom:1px solid #e2e8f0;',
  headerTitle: 'margin:0;font-size:18px;font-weight:700;letter-spacing:0.02em;',
  body: 'padding:24px;',
  title: 'margin:0 0 12px 0;font-size:17px;font-weight:700;color:#0f172a;',
  message: 'margin:0 0 20px 0;color:#334155;white-space:pre-wrap;',
  detailRow: 'margin:8px 0;padding:10px 12px;background:#ffffff;border-radius:10px;border:1px solid #e2e8f0;font-size:14px;color:#334155;',
  buttonWrap: 'margin:20px 0 0 0;text-align:center;',
  button: 'display:inline-block;padding:12px 18px;background:transparent;color:#0f172a !important;text-decoration:none;border-radius:10px;border:1px solid #0f172a;font-weight:700;font-size:14px;',
  footer: 'margin-top:24px;padding-top:20px;border-top:1px solid #e2e8f0;text-align:center;font-size:12px;color:#64748b;',
  footerLink: 'color:#0f172a;text-decoration:none;',
};

/**
 * Génère le HTML d'un email de notification avec en-tête, contenu et pied de page stylés.
 * @param {{ title: string, message: string, link?: string, linkLabel?: string, details?: Array<{ label: string, value: string }> }} options
 * @param {string} baseUrl - URL de base du frontend pour les liens
 * @returns {{ html: string, text: string }}
 */
function buildNotificationEmail(options, baseUrl = '') {
  const { title, message, link, linkLabel = 'Voir dans l\'application', details = [] } = options;
  const fullLink = link ? `${baseUrl.replace(/\/$/, '')}${link.startsWith('/') ? link : `/${link}`}` : '';

  const detailsHtml =
    details.length > 0
      ? details
          .map(
            (d) =>
              `<div style="${styles.detailRow}"><strong>${escapeHtml(d.label)}</strong><br/>${escapeHtml(String(d.value))}</div>`
          )
          .join('')
      : '';

  const buttonHtml =
    fullLink &&
    `<div style="${styles.buttonWrap}">
  <a href="${escapeHtml(fullLink)}" style="${styles.button}">${escapeHtml(linkLabel)}</a>
</div>`;

  const messageHtml = (message || '')
    .split('\n')
    .map((line) => escapeHtml(line))
    .join('<br/>');

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title || 'Notification')}</title>
</head>
<body style="${styles.wrapper}">
  <div style="${styles.container}">
    <div style="${styles.card}">
      <div style="${styles.header}">
        <h1 style="${styles.headerTitle}">${escapeHtml(APP_NAME)}</h1>
      </div>
      <div style="${styles.body}">
        ${title ? `<h2 style="${styles.title}">${escapeHtml(title)}</h2>` : ''}
        ${messageHtml ? `<div style="${styles.message}">${messageHtml}</div>` : ''}
        ${detailsHtml}
        ${buttonHtml}
      </div>
    </div>
    <div style="${styles.footer}">
      <p style="margin:0;">Cet email a été envoyé par <strong>${escapeHtml(APP_NAME)}</strong>.</p>
      <p style="margin:8px 0 0 0;">Merci de ne pas répondre directement à ce message.</p>
    </div>
  </div>
</body>
</html>`;

  const text = [
    title ? `${title}\n` : '',
    message || '',
    details.length ? details.map((d) => `${d.label}: ${d.value}`).join('\n') : '',
    fullLink ? `\n${linkLabel}: ${fullLink}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  return { html: html.trim(), text };
}

/**
 * Génère le HTML d'un email de rappel de tâche (deadline).
 * @param {{ taskTitle: string, dueDate: string, description?: string, link?: string }} options
 * @param {string} baseUrl
 * @returns {{ html: string, text: string }}
 */
function buildTaskDeadlineEmail({ taskTitle, dueDate, daysRemaining, link, isLastWarning }, baseUrl = '') {
  const urgency = isLastWarning ? 'Dernier rappel de deadline' : 'Rappel de deadline';
  const details = [
    { label: 'Date limite', value: dueDate },
    { label: 'Jours restants', value: String(daysRemaining) },
  ];

  const message =
    `Ceci est un rappel concernant la tâche « ${taskTitle} » dont la date limite ` +
    `est fixée au ${dueDate}. Il vous reste ${daysRemaining} jour(s) pour la finaliser.`;

  return buildNotificationEmail(
    {
      title: `${urgency} — ${taskTitle}`,
      message,
      link,
      linkLabel: "Voir la tâche",
      details,
    },
    baseUrl
  );
}

function buildPublicationDeadlineEmail({ publicationTitle, publicationDate, daysRemaining, link, isLastWarning }, baseUrl = '') {
  const urgency = isLastWarning ? 'Dernier rappel de publication' : 'Rappel de publication';
  const details = [
    { label: 'Titre', value: publicationTitle },
    { label: 'Date de publication', value: publicationDate },
    { label: 'Jours restants', value: String(daysRemaining) },
  ];

  const message =
    `La publication « ${publicationTitle} » est prévue pour le ${publicationDate}. ` +
    `Il reste ${daysRemaining} jour(s) avant cette date. ` +
    `Merci de vous assurer que tout est prêt pour la diffusion à la date prévue.`;

  return buildNotificationEmail(
    {
      title: `${urgency} — ${publicationTitle}`,
      message,
      link,
      linkLabel: "Voir la publication",
      details,
    },
    baseUrl
  );
}

function buildEventTasksAssignedEmail({ eventTitle, lines, link }, baseUrl = '') {
  const messageLines = [
    `Dans le cadre de l’événement « ${eventTitle} », vous avez été assigné(e) à une ou plusieurs tâches.`,
    '',
    'Détail des tâches :',
    ...lines,
  ];

  return buildNotificationEmail(
    {
      title: `Tâches d’événement assignées — « ${eventTitle} »`,
      message: messageLines.join('\n'),
      link,
      linkLabel: "Voir l’événement",
      details: [{ label: 'Événement', value: eventTitle }],
    },
    baseUrl
  );
}

function buildProposalValidationRequestEmail({ projectTitle, taskTitle, versionNumber, authorName, submittedAt, link }, baseUrl = '') {
  const target = taskTitle || projectTitle;
  const messageLines = [
    `Vous avez une proposition de tâche à valider : « ${target} ».`,
    `Cette proposition (v${versionNumber}) a été envoyée par ${authorName} le ${submittedAt}.`,
  ];

  const details = [
    { label: 'Projet', value: projectTitle },
  ];
  if (taskTitle) details.push({ label: 'Tâche', value: taskTitle });
  details.push({ label: 'Version', value: `v${versionNumber}` });

  return buildNotificationEmail(
    {
      title: `Validation de proposition de tâche — ${target}`,
      message: messageLines.join('\n'),
      link,
      linkLabel: "Voir la proposition",
      details,
    },
    baseUrl
  );
}

function buildProposalValidationResultEmail({ taskTitle, versionNumber, statusLabel, validatorName, validatedAt, comment, link }, baseUrl = '') {
  const messageLines = [
    `Votre proposition (v${versionNumber}) pour la tâche « ${taskTitle} » a été ${statusLabel}.`,
    '',
    'Commentaire du validateur :',
    comment || '(Aucun commentaire fourni)',
  ];

  const details = [
    { label: 'Tâche', value: taskTitle },
    { label: 'Version', value: `v${versionNumber}` },
    { label: 'Validateur', value: validatorName },
    { label: 'Date de validation', value: validatedAt },
  ];

  return buildNotificationEmail(
    {
      title: `Statut de votre proposition — ${taskTitle}`,
      message: messageLines.join('\n'),
      link,
      linkLabel: "Voir la proposition",
      details,
    },
    baseUrl
  );
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = {
  buildNotificationEmail,
  buildTaskDeadlineEmail,
  buildPublicationDeadlineEmail,
  buildEventTasksAssignedEmail,
  buildProposalValidationRequestEmail,
  buildProposalValidationResultEmail,
  APP_NAME,
};
