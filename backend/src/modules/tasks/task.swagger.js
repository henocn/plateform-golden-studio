'use strict';

/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         status:
 *           type: string
 *           enum: [todo, in_progress, done, blocked, cancelled]
 *         priority:
 *           type: string
 *           enum: [low, normal, high, urgent]
 *         visibility:
 *           type: string
 *           enum: [internal_only, client_visible]
 *         due_date:
 *           type: string
 *           format: date
 *
 *     CreateTaskRequest:
 *       type: object
 *       required: [project_id, title]
 *       properties:
 *         project_id:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         assigned_to:
 *           type: string
 *           format: uuid
 *         due_date:
 *           type: string
 *           format: date
 *         priority:
 *           type: string
 *           enum: [low, normal, high, urgent]
 *         visibility:
 *           type: string
 *           enum: [internal_only, client_visible]
 *
 *     TaskComment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         content:
 *           type: string
 *         is_internal:
 *           type: boolean
 *         author:
 *           type: object
 */

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: List tasks (with visibility filtering for clients)
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: assignee
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [todo, in_progress, done, blocked, cancelled]
 *       - in: query
 *         name: overdue
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: urgent
 *         schema:
 *           type: boolean
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
 *         description: List of tasks
 *
 *   post:
 *     summary: Create a task (internal only)
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTaskRequest'
 *     responses:
 *       201:
 *         description: Task created
 *
 * /tasks/{id}:
 *   get:
 *     summary: Task detail
 *     tags: [Tasks]
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
 *         description: Task detail
 *
 *   put:
 *     summary: Update task (internal only)
 *     tags: [Tasks]
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
 *             $ref: '#/components/schemas/CreateTaskRequest'
 *     responses:
 *       200:
 *         description: Task updated
 *
 *   delete:
 *     summary: Delete task (internal admin+)
 *     tags: [Tasks]
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
 *         description: Task deleted
 *
 * /tasks/{id}/status:
 *   patch:
 *     summary: Change task status (internal only)
 *     tags: [Tasks]
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
 *                 enum: [todo, in_progress, done, blocked, cancelled]
 *     responses:
 *       200:
 *         description: Status changed
 *
 * /tasks/{id}/comments:
 *   get:
 *     summary: List comments (clients see only non-internal)
 *     tags: [Tasks]
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
 *         description: List of comments
 *
 *   post:
 *     summary: Add comment (is_internal auto-deduced)
 *     tags: [Tasks]
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
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment added
 *
 * /tasks/{id}/comments/{cid}:
 *   delete:
 *     summary: Delete own comment
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: cid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Comment deleted
 */

module.exports = {};
