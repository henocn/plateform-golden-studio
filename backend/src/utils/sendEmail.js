'use strict';

const { transporter, isEmailConfigured } = require('../config/email');
const env = require('../config/env');
const logger = require('./logger');

/**
 * Envoie un email. No-op si l'email n'est pas configuré (pas de throw).
 * @param {{ to: string, subject: string, html?: string, text?: string }} options
 * @returns {Promise<object|null>} info nodemailer ou null si non envoyé
 */
async function sendEmail({ to, subject, html, text, type }) {
  if (!isEmailConfigured() || !env.EMAIL_FROM || !to) {
    return null;
  }

  const mailOptions = {
    from: env.EMAIL_FROM,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    html: html || text || '',
    text: text || (html && html.replace(/<[^>]+>/g, '').trim()) || '',
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`[${type} :] Email envoyé ${JSON.stringify({ messageId: info.messageId, to: mailOptions.to })}`);
    return info;
  } catch (err) {
    logger.error(`[${type} :] Erreur envoi email ${JSON.stringify({ error: err.message, to: mailOptions.to })}`);
    return null;
  }
}

module.exports = sendEmail;
