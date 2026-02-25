const transporter = require('../config/email');

const sendEmail = async ({ to, subject, html, text }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
    text,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('Email envoyé :', info.messageId);
  return info;
};

module.exports = sendEmail;