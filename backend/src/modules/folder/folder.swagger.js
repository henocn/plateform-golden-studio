'use strict';

/**
 * @swagger
 * /folder:
 *   get:
 *     summary: List folders (org-scoped)
 *     tags: [Folders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: parent_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
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
 *         description: List of folders
 *
 *   post:
 *     summary: Create folder
 *     tags: [Folders]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               parent_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Folder created
 *
 * /folder/{id}:
 *   get:
 *     summary: Get folder by ID
 *     tags: [Folders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *     responses:
 *       200:
 *         description: Folder retrieved
 *
 *   put:
 *     summary: Update folder
 *     tags: [Folders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               parent_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Folder updated
 *
 *   delete:
 *     summary: Delete folder
 *     tags: [Folders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *     responses:
 *       200:
 *         description: Folder deleted
 */
