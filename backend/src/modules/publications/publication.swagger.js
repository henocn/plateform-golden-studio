'use strict';

/**
 * @swagger
 * components:
 *   schemas:
 *     Publication:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         channel:
 *           type: string
 *           enum: [facebook, linkedin, official_release, website, tv, radio, other]
 *         publication_date:
 *           type: string
 *           format: date-time
 *         link:
 *           type: string
 *         archive_path:
 *           type: string
 *
 * /projects/{projectId}/publications:
 *   get:
 *     summary: List publications for a project
 *     tags: [Publications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of publications
 *
 *   post:
 *     summary: Create publication (internal contributor+)
 *     tags: [Publications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
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
 *             required: [channel]
 *             properties:
 *               channel:
 *                 type: string
 *                 enum: [facebook, linkedin, official_release, website, tv, radio, other]
 *               publication_date:
 *                 type: string
 *                 format: date-time
 *               link:
 *                 type: string
 *               proposal_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Publication created
 *
 * /projects/{projectId}/publications/{id}:
 *   put:
 *     summary: Update publication
 *     tags: [Publications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Publication updated
 *
 *   delete:
 *     summary: Delete publication (internal admin+)
 *     tags: [Publications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Publication deleted
 */

module.exports = {};
