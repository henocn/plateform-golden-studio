'use strict';

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         email:
 *           type: string
 *           format: email
 *         first_name:
 *           type: string
 *         last_name:
 *           type: string
 *         user_type:
 *           type: string
 *           enum: [internal, client]
 *         role:
 *           type: string
 *         job_title:
 *           type: string
 *           nullable: true
 *         avatar_path:
 *           type: string
 *           nullable: true
 *         is_active:
 *           type: boolean
 *         two_factor_enabled:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     CreateInternalUserRequest:
 *       type: object
 *       required: [email, password, first_name, last_name, role]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *         first_name:
 *           type: string
 *         last_name:
 *           type: string
 *         role:
 *           type: string
 *           enum: [super_admin, admin, validator, contributor, reader]
 *         job_title:
 *           type: string
 *
 *     CreateClientUserRequest:
 *       type: object
 *       required: [email, password, first_name, last_name, role]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *         first_name:
 *           type: string
 *         last_name:
 *           type: string
 *         role:
 *           type: string
 *           enum: [client_admin, client_validator, client_contributor, client_reader]
 *         job_title:
 *           type: string
 */

/**
 * @swagger
 * /users/internal:
 *   get:
 *     summary: List internal users (super_admin only)
 *     tags: [Users — Internal]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *       - in: query
 *         name: is_active
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
 *         description: List of internal users
 *       403:
 *         description: Insufficient role
 *
 *   post:
 *     summary: Create internal user (super_admin only)
 *     tags: [Users — Internal]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateInternalUserRequest'
 *     responses:
 *       201:
 *         description: User created
 *       409:
 *         description: Email already exists
 *
 * /users/internal/{id}/role:
 *   patch:
 *     summary: Change internal user role (super_admin only)
 *     tags: [Users — Internal]
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
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [super_admin, admin, validator, contributor, reader]
 *     responses:
 *       200:
 *         description: Role updated
 *
 * /users/clients:
 *   get:
 *     summary: List client users
 *     tags: [Users — Clients]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
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
 *         description: List of client users
 *
 *   post:
 *     summary: Create client user
 *     tags: [Users — Clients]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateClientUserRequest'
 *     responses:
 *       201:
 *         description: User created
 *       409:
 *         description: Email already exists
 *
 * /users/clients/{id}/role:
 *   patch:
 *     summary: Change client user role
 *     tags: [Users — Clients]
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
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [client_admin, client_validator, client_contributor, client_reader]
 *     responses:
 *       200:
 *         description: Role updated
 *
 * /users/{id}:
 *   get:
 *     summary: Get user detail
 *     tags: [Users — Internal, Users — Clients]
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
 *         description: User detail
 *       404:
 *         description: Not found
 *
 *   put:
 *     summary: Update user profile
 *     tags: [Users — Internal, Users — Clients]
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
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               job_title:
 *                 type: string
 *               avatar_path:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated
 *
 * /users/{id}/status:
 *   patch:
 *     summary: Activate / deactivate user
 *     tags: [Users — Internal, Users — Clients]
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
 *             required: [is_active]
 *             properties:
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Status updated
 */

module.exports = {};
