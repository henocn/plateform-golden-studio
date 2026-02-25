const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});


transporter.verify((error) => {
  if (error) {
    console.error('Erreur config email :', error.message);
  } else {
    console.log('Serveur email prêt');
  }
});

module.exports = transporter;