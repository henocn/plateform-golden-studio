'use strict';

/**
 * @swagger
 * components:
 *   schemas:
 *     Organization:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           example: "Ministère de la Communication"
 *         short_name:
 *           type: string
 *           example: "MIPISE"
 *         type:
 *           type: string
 *           enum: [ministry, agency, public_enterprise, institution, other]
 *         logo_path:
 *           type: string
 *           nullable: true
 *         contact_email:
 *           type: string
 *           format: email
 *         contact_phone:
 *           type: string
 *         address:
 *           type: string
 *         is_active:
 *           type: boolean
 *         created_by:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CreateOrganizationRequest:
 *       type: object
 *       required:
 *         - name
 *         - type
 *       properties:
 *         name:
 *           type: string
 *         short_name:
 *           type: string
 *         type:
 *           type: string
 *           enum: [ministry, agency, public_enterprise, institution, other]
 *         logo_path:
 *           type: string
 *         contact_email:
 *           type: string
 *           format: email
 *         contact_phone:
 *           type: string
 *         address:
 *           type: string
 *
 *     OrgStats:
 *       type: object
 *       properties:
 *         total_users:
 *           type: integer
 *         total_projects:
 *           type: integer
 *         active_projects:
 *           type: integer
 */

/**
 * @swagger
 * /organizations:
 *   get:
 *     summary: List all organizations
 *     tags: [Organizations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [ministry, agency, public_enterprise, institution, other]
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: List of organizations
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (client users)
 *
 *   post:
 *     summary: Create an organization
 *     tags: [Organizations]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrganizationRequest'
 *     responses:
 *       201:
 *         description: Organization created
 *       400:
 *         description: Validation error
 *       403:
 *         description: Insufficient role
 *
 * /organizations/{id}:
 *   get:
 *     summary: Get organization detail
 *     tags: [Organizations]
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
 *         description: Organization detail
 *       404:
 *         description: Not found
 *
 *   put:
 *     summary: Update organization
 *     tags: [Organizations]
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
 *             $ref: '#/components/schemas/CreateOrganizationRequest'
 *     responses:
 *       200:
 *         description: Organization updated
 *       404:
 *         description: Not found
 *
 * /organizations/{id}/status:
 *   patch:
 *     summary: Activate / deactivate organization
 *     tags: [Organizations]
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
 *       404:
 *         description: Not found
 *
 * /organizations/{id}/users:
 *   get:
 *     summary: Get users of an organization
 *     tags: [Organizations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
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
 *         description: List of users
 *       404:
 *         description: Organization not found
 *
 * /organizations/{id}/projects:
 *   get:
 *     summary: Get projects of an organization
 *     tags: [Organizations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
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
 *         description: List of projects
 *       404:
 *         description: Organization not found
 *
 * /organizations/{id}/stats:
 *   get:
 *     summary: Get KPIs of an organization
 *     tags: [Organizations]
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
 *         description: Organization stats
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrgStats'
 *       404:
 *         description: Organization not found
 */

module.exports = {};
