'use strict';

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: admin@goldenstudio.com
 *         password:
 *           type: string
 *           format: password
 *           example: Admin@1234
 *         totp_code:
 *           type: string
 *           pattern: '^\d{6}$'
 *           description: Optional 2FA code (required if 2FA is enabled)
 *           example: "123456"
 *
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             requires_2fa:
 *               type: boolean
 *             access_token:
 *               type: string
 *             refresh_token:
 *               type: string
 *             temp_token:
 *               type: string
 *               description: Only present when requires_2fa is true
 *             user:
 *               $ref: '#/components/schemas/AuthUser'
 *         message:
 *           type: string
 *
 *     AuthUser:
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
 *           enum: [super_admin, admin, validator, contributor, reader, client_admin, client_validator, client_contributor, client_reader]
 *         organization_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         avatar_path:
 *           type: string
 *           nullable: true
 *         two_factor_enabled:
 *           type: boolean
 *
 *     RefreshRequest:
 *       type: object
 *       required:
 *         - refresh_token
 *       properties:
 *         refresh_token:
 *           type: string
 *
 *     ChangePasswordRequest:
 *       type: object
 *       required:
 *         - current_password
 *         - new_password
 *         - confirm_password
 *       properties:
 *         current_password:
 *           type: string
 *           format: password
 *         new_password:
 *           type: string
 *           format: password
 *         confirm_password:
 *           type: string
 *           format: password
 *
 *     TOTPCodeRequest:
 *       type: object
 *       required:
 *         - totp_code
 *       properties:
 *         totp_code:
 *           type: string
 *           pattern: '^\d{6}$'
 *           example: "123456"
 *
 *     Enable2FAResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             secret:
 *               type: string
 *             otpauth_url:
 *               type: string
 *             qr_code:
 *               type: string
 *               description: QR code as data URL
 *         message:
 *           type: string
 */

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication & 2FA
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login (universal for internal + client users)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful (or 2FA required)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *       429:
 *         description: Too many authentication attempts
 */

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout (revoke refresh token)
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshRequest'
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshRequest'
 *     responses:
 *       200:
 *         description: Token refreshed
 *       401:
 *         description: Invalid or expired refresh token
 */

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change own password
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Password changed
 *       400:
 *         description: Current password is incorrect
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /auth/2fa/enable:
 *   post:
 *     summary: Generate 2FA secret and QR code
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 2FA secret generated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Enable2FAResponse'
 *       409:
 *         description: 2FA already enabled
 */

/**
 * @swagger
 * /auth/2fa/verify:
 *   post:
 *     summary: Verify TOTP code (activate 2FA or complete 2FA login)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/TOTPCodeRequest'
 *               - type: object
 *                 properties:
 *                   temp_token:
 *                     type: string
 *                     description: Temporary token from login response (for login 2FA flow)
 *     responses:
 *       200:
 *         description: 2FA verified
 *       401:
 *         description: Invalid 2FA code
 */

/**
 * @swagger
 * /auth/2fa/disable:
 *   post:
 *     summary: Disable 2FA (requires current TOTP code)
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TOTPCodeRequest'
 *     responses:
 *       200:
 *         description: 2FA disabled
 *       401:
 *         description: Invalid 2FA code
 */

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized
 */

module.exports = {};
