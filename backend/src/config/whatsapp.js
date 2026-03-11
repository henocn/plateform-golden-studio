// ============================================================
//  whatsapp-service.js
//  Module d'envoi de notifications WhatsApp pour rappels de tâches
// ============================================================

const env = require('./env');

const PHONE_NUMBER_ID = env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN    = env.WHATSAPP_ACCESS_TOKEN;
const API_VERSION     = env.WHATSAPP_API_VERSION;
const API_URL         = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;
const POSSIBLE_NUMBERS = [
  "22879966289",
  "22870815285",
];

// ============================================================
//  Fonction principale : envoyer un message WhatsApp (template hello_world)
// ============================================================
async function sendWhatsAppMessage(to) {
  const body = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: 'hello_world',
      language: { code: 'en_US' },
    },
  };

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`WhatsApp API error: ${JSON.stringify(data.error)}`);
  }

  console.log(`Message envoyé à ${to} — ID: ${data.messages?.[0]?.id}`);
  return data;
}

// ============================================================
//  Fonctions métier spécifiques à la plateforme
// ============================================================

// Envoie un WhatsApp à tous les numéros configurés lors de la création d'un événement
async function sendEventCreatedNotification() {
  for (const phone of POSSIBLE_NUMBERS) {
    try {
      await sendWhatsAppMessage(phone);
    } catch (err) {
      console.error('[WhatsApp] Erreur envoi evenement', { phone, error: err.message });
    }
  }
}

// ============================================================
//  EXPORT
// ============================================================
module.exports = {
  sendWhatsAppMessage,
  sendEventCreatedNotification,
  POSSIBLE_NUMBERS,
};