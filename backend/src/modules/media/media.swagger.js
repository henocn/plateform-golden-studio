'use strict';

/**
 * @swagger
 * /media:
 *   get:
 *     summary: List media (global + org-scoped)
 *     tags: [Médiathèque]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [logo, graphic_charter, video, photo, template, document, other]
 *       - in: query
 *         name: is_global
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *       - in: query
 *         name: folder_id
 *         schema:
 *           type: string
 *           format: uuid
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
 *         description: List of media
 *
 *   post:
 *     summary: Upload media (internal contributor+)
 *     tags: [Médiathèque]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, type, file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [logo, graphic_charter, video, photo, template, document, other]
 *               organization_id:
 *                 type: string
 *                 format: uuid
 *               folder_id:
 *                 type: string
 *                 format: uuid
 *               tags:
 *                 type: string
 *                 description: JSON array of tags
 *               is_global:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Media uploaded
 *
 * /media/{id}:
 *   get:
 *     summary: Media detail
 *     tags: [Médiathèque]
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
 *         description: Media detail
 *
 *   put:
 *     summary: Update metadata
 *     tags: [Médiathèque]
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
 *         description: Media updated
 *
 *   delete:
 *     summary: Delete media (internal admin+)
 *     tags: [Médiathèque]
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
 *         description: Media deleted
 *
 * /media/{id}/download:
 *   get:
 *     summary: Download media file
 *     tags: [Médiathèque]
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
 *         description: File download
 */

module.exports = {};
