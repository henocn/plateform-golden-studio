'use strict';

/**
 * @swagger
 * /reporting/overview:
 *   get:
 *     summary: KPIs overview (global or org-scoped)
 *     tags: [Reporting]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: KPI overview
 *
 * /reporting/projects:
 *   get:
 *     summary: Project statistics
 *     tags: [Reporting]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Project stats
 *
 * /reporting/users:
 *   get:
 *     summary: User statistics (internal admin+)
 *     tags: [Reporting]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User stats
 *
 * /reporting/publications:
 *   get:
 *     summary: Publication statistics by channel
 *     tags: [Reporting]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Publication stats
 *
 * /reporting/validations:
 *   get:
 *     summary: Validation statistics
 *     tags: [Reporting]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Validation stats
 *
 * /reporting/export/pdf:
 *   get:
 *     summary: Export PDF report
 *     tags: [Reporting]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: PDF export
 *
 * /reporting/export/excel:
 *   get:
 *     summary: Export Excel report
 *     tags: [Reporting]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Excel export
 */

module.exports = {};
