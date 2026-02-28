'use strict';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

const env = require('../../config/env');
const { User, RefreshToken } = require('../../models');
const ApiError = require('../../utils/ApiError');
const logger = require('../../utils/logger');

/**
 * Generate JWT access token (short-lived)
 */
const generateAccessToken = (user) => jwt.sign(
  {
    id: user.id,
    email: user.email,
    user_type: user.user_type,
    role: user.role,
  },
  env.JWT_ACCESS_SECRET,
  { expiresIn: env.JWT_ACCESS_EXPIRES_IN },
);

/**
 * Generate opaque refresh token + store hash in DB
 */
const generateRefreshToken = async (userId) => {
  const rawToken = crypto.randomBytes(64).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  // Calculate expiry from JWT_REFRESH_EXPIRES_IN (e.g. '7d')
  const match = env.JWT_REFRESH_EXPIRES_IN.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error('Invalid JWT_REFRESH_EXPIRES_IN format');
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  const expiresAt = new Date(Date.now() + parseInt(match[1], 10) * multipliers[match[2]]);

  await RefreshToken.create({
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt,
    revoked: false,
  });

  return rawToken;
};

/**
 * Login — universal for internal + client users
 */
const login = async ({ email, password, totp_code }) => {
  // Fetch user WITH password_hash
  const user = await User.scope('withPassword').findOne({ where: { email } });

  if (!user) {
    throw ApiError.invalidCredentials();
  }

  if (!user.is_active) {
    throw ApiError.unauthorized('Votre compte a été désactivé. Veuillez contacter un administrateur.');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw ApiError.invalidCredentials();
  }

  // Handle 2FA
  if (user.two_factor_enabled) {
    if (!totp_code) {
      // Signal that 2FA is required — return partial response
      return {
        requires_2fa: true,
        temp_token: jwt.sign(
          { id: user.id, purpose: '2fa_pending' },
          env.JWT_ACCESS_SECRET,
          { expiresIn: '5m' },
        ),
      };
    }

    // Verify TOTP code
    const userWith2FA = await User.scope('withTwoFactor').findByPk(user.id);
    const isValid = speakeasy.totp.verify({
      secret: userWith2FA.two_factor_secret,
      encoding: 'base32',
      token: totp_code,
      window: 1,
    });

    if (!isValid) {
      throw ApiError.unauthorized('Code 2FA invalide');
    }
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user.id);

  // Update last_login_at
  await user.update({ last_login_at: new Date() }, { hooks: false });

  logger.info(`User logged in: ${user.email} (${user.user_type}/${user.role})`);

  return {
    requires_2fa: false,
    access_token: accessToken,
    refresh_token: refreshToken,
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      user_type: user.user_type,
      role: user.role,
      avatar_path: user.avatar_path,
      two_factor_enabled: user.two_factor_enabled,
    },
  };
};

/**
 * Verify 2FA code (step 2 of login when 2FA is enabled)
 */
const verify2FALogin = async (tempToken, totpCode) => {
  let decoded;
  try {
    decoded = jwt.verify(tempToken, env.JWT_ACCESS_SECRET);
  } catch (_err) {
    throw ApiError.unauthorized('2FA session expired. Please login again.');
  }

  if (decoded.purpose !== '2fa_pending') {
    throw ApiError.unauthorized('Invalid 2FA session token');
  }

  const user = await User.scope('withTwoFactor').findByPk(decoded.id);
  if (!user) throw ApiError.notFound('Utilisateur');

  const isValid = speakeasy.totp.verify({
    secret: user.two_factor_secret,
    encoding: 'base32',
    token: totpCode,
    window: 1,
  });

  if (!isValid) {
    throw ApiError.unauthorized('Code 2FA invalide');
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user.id);
  await user.update({ last_login_at: new Date() }, { hooks: false });

  logger.info(`User completed 2FA login: ${user.email}`);

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      user_type: user.user_type,
      role: user.role,
      avatar_path: user.avatar_path,
      two_factor_enabled: user.two_factor_enabled,
    },
  };
};

/**
 * Refresh access token using refresh token
 */
const refresh = async (rawRefreshToken) => {
  const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

  const storedToken = await RefreshToken.findOne({
    where: { token_hash: tokenHash, revoked: false },
  });

  if (!storedToken) {
    throw ApiError.unauthorized('Invalid or revoked refresh token');
  }

  if (new Date() > storedToken.expires_at) {
    await storedToken.update({ revoked: true });
    throw ApiError.tokenExpired();
  }

  const user = await User.findByPk(storedToken.user_id);
  if (!user || !user.is_active) {
    await storedToken.update({ revoked: true });
    throw ApiError.unauthorized('User not found or deactivated');
  }

  // Token rotation — revoke old, issue new
  await storedToken.update({ revoked: true });

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = await generateRefreshToken(user.id);

  return {
    access_token: newAccessToken,
    refresh_token: newRefreshToken,
  };
};

/**
 * Logout — revoke refresh token
 */
const logout = async (rawRefreshToken) => {
  const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

  const storedToken = await RefreshToken.findOne({
    where: { token_hash: tokenHash },
  });

  if (storedToken && !storedToken.revoked) {
    await storedToken.update({ revoked: true });
  }

  // Always return success even if token not found (security best practice)
  return true;
};

/**
 * Change password
 */
const changePassword = async (userId, { current_password, new_password }) => {
  const user = await User.scope('withPassword').findByPk(userId);
  if (!user) throw ApiError.notFound('Utilisateur');

  const isCurrentValid = await bcrypt.compare(current_password, user.password_hash);
  if (!isCurrentValid) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  const salt = await bcrypt.genSalt(12);
  const newHash = await bcrypt.hash(new_password, salt);

  await user.update({ password_hash: newHash });
  logger.info(`Password changed for user: ${user.email}`);

  return true;
};

/**
 * Enable 2FA — generate TOTP secret + QR code URI
 */
const enable2FA = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) throw ApiError.notFound('Utilisateur');

  if (user.two_factor_enabled) {
    throw ApiError.conflict('2FA is already enabled');
  }

  const secret = speakeasy.generateSecret({
    name: `${env.TWO_FACTOR_APP_NAME} (${user.email})`,
    issuer: env.TWO_FACTOR_APP_NAME,
    length: 32,
  });

  // Store secret (not yet enabled until verified)
  await user.update({ two_factor_secret: secret.base32 }, { hooks: false });

  // Generate QR code as data URL
  const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

  return {
    secret: secret.base32,
    otpauth_url: secret.otpauth_url,
    qr_code: qrCodeUrl,
  };
};

/**
 * Verify 2FA — confirm TOTP code and activate 2FA
 */
const verify2FA = async (userId, totpCode) => {
  const user = await User.scope('withTwoFactor').findByPk(userId);
  if (!user) throw ApiError.notFound('Utilisateur');

  if (!user.two_factor_secret) {
    throw ApiError.badRequest('2FA has not been initialized. Call enable first.');
  }

  const isValid = speakeasy.totp.verify({
    secret: user.two_factor_secret,
    encoding: 'base32',
    token: totpCode,
    window: 1,
  });

  if (!isValid) {
    throw ApiError.unauthorized('Code 2FA invalide');
  }

  await user.update({ two_factor_enabled: true }, { hooks: false });
  logger.info(`2FA enabled for user: ${user.email}`);

  return true;
};

/**
 * Disable 2FA
 */
const disable2FA = async (userId, totpCode) => {
  const user = await User.scope('withTwoFactor').findByPk(userId);
  if (!user) throw ApiError.notFound('Utilisateur');

  if (!user.two_factor_enabled) {
    throw ApiError.badRequest('2FA is not enabled');
  }

  const isValid = speakeasy.totp.verify({
    secret: user.two_factor_secret,
    encoding: 'base32',
    token: totpCode,
    window: 1,
  });

  if (!isValid) {
    throw ApiError.unauthorized('Code 2FA invalide');
  }

  await user.update({ two_factor_secret: null, two_factor_enabled: false }, { hooks: false });
  logger.info(`2FA disabled for user: ${user.email}`);

  return true;
};

/**
 * Get current user profile
 */
/**
 * Récupère le profil de l'utilisateur connecté
 */
const getMe = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) throw ApiError.notFound('Utilisateur');

  return user;
};

module.exports = {
  login,
  verify2FALogin,
  refresh,
  logout,
  changePassword,
  enable2FA,
  verify2FA,
  disable2FA,
  getMe,
};
