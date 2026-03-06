'use strict';

const nodemailer = require('nodemailer');
const env = require('./env');

/* Transporter optionnel : null si l'email n'est pas configuré (EMAIL_HOST vide) */
let transporter = null;

if (env.EMAIL_HOST && env.EMAIL_USER && env.EMAIL_APP_PASSWORD) {
  transporter = nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: Number(env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_APP_PASSWORD,
    },
  });
  transporter.verify((err) => {
    if (err) {
      console.error('[Email] Configuration invalide:', err.message);
    } else {
      console.log('[Email] Serveur prêt');
    }
  });
}

module.exports = { transporter, isEmailConfigured: () => !!transporter };
