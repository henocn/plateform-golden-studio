'use strict';

/**
 * @swagger
 * /calendar:
 *   get:
 *     summary: List calendar events (client sees only client_visible)
 *     tags: [Calendar]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [publication, event_coverage, filming, deliverable_deadline, meeting]
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, validated, scheduled, published, cancelled]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of events
 *
 *   post:
 *     summary: Create event (internal contributor+)
 *     tags: [Calendar]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, type, start_date]
 *             properties:
 *               project_id:
 *                 type: string
 *                 format: uuid
 *               title:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [publication, event_coverage, filming, deliverable_deadline, meeting]
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *               visibility:
 *                 type: string
 *                 enum: [internal_only, client_visible]
 *     responses:
 *       201:
 *         description: Event created
 *
 * /calendar/{id}:
 *   get:
 *     summary: Event detail
 *     tags: [Calendar]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Event detail
 *
 *   put:
 *     summary: Update event (internal)
 *     tags: [Calendar]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Event updated
 *
 *   delete:
 *     summary: Delete event (internal admin+)
 *     tags: [Calendar]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Event deleted
 *
 * /calendar/{id}/status:
 *   patch:
 *     summary: Change event status (internal)
 *     tags: [Calendar]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, validated, scheduled, published, cancelled]
 *     responses:
 *       200:
 *         description: Status updated
 */

module.exports = {};
