'use strict';

/**
 * @swagger
 * components:
 *   schemas:
 *     Brief:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         description:
 *           type: string
 *         objective:
 *           type: string
 *         target_audience:
 *           type: string
 *         key_message:
 *           type: string
 *         deadline:
 *           type: string
 *           format: date
 *         submitted_by:
 *           type: string
 *           format: uuid
 *         attachments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/BriefAttachment'
 *
 *     BriefAttachment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         file_name:
 *           type: string
 *         file_path:
 *           type: string
 *         file_size:
 *           type: integer
 *         mime_type:
 *           type: string
 *
 *     CreateBriefRequest:
 *       type: object
 *       required: [description]
 *       properties:
 *         description:
 *           type: string
 *         objective:
 *           type: string
 *         target_audience:
 *           type: string
 *         key_message:
 *           type: string
 *         deadline:
 *           type: string
 *           format: date
 */

/**
 * @swagger
 * /projects/{projectId}/briefs:
 *   get:
 *     summary: List briefs for a project
 *     tags: [Briefs]
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
 *         description: List of briefs
 *
 *   post:
 *     summary: Create/submit a brief
 *     tags: [Briefs]
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
 *             $ref: '#/components/schemas/CreateBriefRequest'
 *     responses:
 *       201:
 *         description: Brief created
 *
 * /projects/{projectId}/briefs/{id}:
 *   put:
 *     summary: Update a brief
 *     tags: [Briefs]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBriefRequest'
 *     responses:
 *       200:
 *         description: Brief updated
 *
 * /projects/{projectId}/briefs/{id}/attachments:
 *   post:
 *     summary: Upload attachment to brief
 *     tags: [Briefs]
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
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Attachment uploaded
 *
 * /projects/{projectId}/briefs/{id}/attachments/{attachId}:
 *   delete:
 *     summary: Delete attachment from brief
 *     tags: [Briefs]
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
 *       - in: path
 *         name: attachId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Attachment deleted
 */

module.exports = {};
