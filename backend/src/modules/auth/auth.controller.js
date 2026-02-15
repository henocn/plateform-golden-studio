'use strict';

const authService = require('./auth.service');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * POST /api/v1/auth/login
 */
const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);

    if (result.requires_2fa) {
      return ApiResponse.success(res, {
        requires_2fa: true,
        temp_token: result.temp_token,
      }, 'Two-factor authentication required');
    }

    return ApiResponse.success(res, {
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      user: result.user,
    }, 'Login successful');
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/v1/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    await authService.logout(req.body.refresh_token);
    return ApiResponse.success(res, null, 'Logged out successfully');
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/v1/auth/refresh
 */
const refresh = async (req, res, next) => {
  try {
    const tokens = await authService.refresh(req.body.refresh_token);
    return ApiResponse.success(res, tokens, 'Token refreshed successfully');
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/v1/auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    await authService.changePassword(req.user.id, req.body);
    return ApiResponse.success(res, null, 'Password changed successfully');
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/v1/auth/2fa/enable
 */
const enable2FA = async (req, res, next) => {
  try {
    const result = await authService.enable2FA(req.user.id);
    return ApiResponse.success(res, result, '2FA secret generated. Scan the QR code and verify with a TOTP code.');
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/v1/auth/2fa/verify
 */
const verify2FA = async (req, res, next) => {
  try {
    // Check if this is a login 2FA verification (temp_token in body)
    if (req.body.temp_token) {
      const result = await authService.verify2FALogin(req.body.temp_token, req.body.totp_code);
      return ApiResponse.success(res, {
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        user: result.user,
      }, 'Two-factor authentication verified');
    }

    // Otherwise this is 2FA activation verification (user is already authenticated)
    await authService.verify2FA(req.user.id, req.body.totp_code);
    return ApiResponse.success(res, null, '2FA has been activated successfully');
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/v1/auth/2fa/disable
 */
const disable2FA = async (req, res, next) => {
  try {
    await authService.disable2FA(req.user.id, req.body.totp_code);
    return ApiResponse.success(res, null, '2FA has been disabled');
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/v1/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    return ApiResponse.success(res, { user }, 'User profile retrieved');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  login,
  logout,
  refresh,
  changePassword,
  enable2FA,
  verify2FA,
  disable2FA,
  getMe,
};
