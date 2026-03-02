'use strict';

const swaggerJsdoc = require('swagger-jsdoc');
const env = require('./env');

const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'GovCom Platform API',
    version: '1.0.0',
    description:
      'API de la plateforme de Gouvernance et de Suivi de Communication Institutionnelle.\n\n' +
      '**Deux types d\'utilisateurs :**\n' +
      '- `internal` — Employés Golden Studio (backoffice)\n' +
      '- `client` — Utilisateurs des institutions clientes',
    contact: {
      name: 'Golden Studio',
      email: 'dev@goldenstudio.com',
    },
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}${env.API_PREFIX}`,
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT access token. Obtenu via POST /auth/login',
      },
    },
  },
  security: [{ BearerAuth: [] }],
  tags: [
    { name: 'Auth', description: 'Authentification & 2FA' },
    { name: 'Organizations', description: 'Gestion des clients (backoffice)' },
    { name: 'Users — Internal', description: 'Utilisateurs Golden Studio' },
    { name: 'Users — Clients', description: 'Utilisateurs des institutions' },
    { name: 'Projects', description: 'Projets (backoffice + portail)' },
    { name: 'Tasks', description: 'Tâches et commentaires' },
    { name: 'Proposals', description: 'Propositions & workflow de validation' },
    { name: 'Publications', description: 'Publications' },
    { name: 'Calendar', description: 'Calendrier éditorial' },
    { name: 'Media Library', description: 'Médiathèque' },
    { name: 'Reporting', description: 'KPIs & exports' },
    { name: 'Audit', description: 'Journal d\'activité' },
  ],
};

const options = {
  swaggerDefinition,
  // Chemins vers les fichiers contenant les annotations Swagger
  apis: [
    './src/modules/**/*.swagger.js',
    './src/modules/**/*.routes.js',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
