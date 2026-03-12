'use strict';

const bcrypt = require('bcrypt');
const userRepository = require('./user.repository');
const ApiError = require('../../utils/ApiError');

const INTERNAL_ROLES = ['super_admin', 'admin', 'validator', 'contributor', 'reader'];
const CLIENT_ROLES = ['client_admin', 'client_validator', 'client_contributor', 'client_reader'];

/**
 * User Service — business logic
 */
class UserService {
  /**
   * List internal users (super_admin/admin only)
   */
  async listInternal(filters) {
    return userRepository.findInternalUsers(filters);
  }

  /**
   * List client users (internal: admin+ OR client_admin for their own org)
   */
  async listClients(filters) {
    return userRepository.findClientUsers(filters);
  }

  /**
   * Get user by ID
   */
  async getById(id) {
    const user = await userRepository.findById(id);
    if (!user) throw ApiError.notFound('User');
    return user;
  }

  /**
   * Create internal user (super_admin only)
   */
  async createInternal(data, createdBy) {
    // Validate role is internal
    if (!INTERNAL_ROLES.includes(data.role)) {
      throw ApiError.badRequest(`Le rôle doit être l'un des suivants: ${INTERNAL_ROLES.join(', ')}`);
    }

    // Check email uniqueness
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw ApiError.conflict('Un utilisateur avec cet email existe déjà');
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(data.password, salt);

    return userRepository.create({
      ...data,
      password_hash,
      user_type: 'internal',
      created_by: createdBy,
    });
  }

  /**
   * Create client user
   * - internal admin+ can create for any org
   * - client_admin can create only within their own org
   */
  /**
   * Crée un utilisateur client
   */
  async createClient(data, requestUser) {
    if (!CLIENT_ROLES.includes(data.role)) {
      throw ApiError.badRequest(`Le rôle doit être l'un des suivants: ${CLIENT_ROLES.join(', ')}`);
    }

    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw ApiError.conflict('Un utilisateur avec cet email existe déjà');
    }

    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(data.password, salt);

    return userRepository.create({
      ...data,
      password_hash,
      user_type: 'client',
      created_by: requestUser.id,
    });
  }

  /**
   * Met à jour le profil utilisateur. Le super_admin peut aussi modifier l'email.
   */
  async update(id, data, requestUser) {
    const user = await userRepository.findById(id);
    if (!user) throw ApiError.notFound('User');

    const { email, password, role, user_type, password_hash, ...safeData } = data;

    if (requestUser.role === 'super_admin' && email != null && email !== '') {
      const existing = await userRepository.findByEmail(email);
      if (existing && existing.id !== id) {
        throw ApiError.conflict('Un utilisateur avec cet email existe déjà');
      }
      safeData.email = email.trim();
    }

    return userRepository.update(id, safeData);
  }

  /**
   * Met à jour les préférences de notifications de l'utilisateur courant
   */
  async updateNotificationSettings(userId, settings) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User');
    const current = user.notification_settings || {};
    const next = { ...current, ...settings };
    return userRepository.update(userId, { notification_settings: next });
  }

  /**
   * Change internal user role (super_admin only)
   */
  async changeInternalRole(id, newRole) {
    if (!INTERNAL_ROLES.includes(newRole)) {
      throw ApiError.badRequest(`Le rôle doit être l'un des suivants: ${INTERNAL_ROLES.join(', ')}`);
    }

    const user = await userRepository.findById(id);
    if (!user) throw ApiError.notFound('User');
    if (user.user_type !== 'internal') {
      throw ApiError.badRequest('Cet utilisateur n\'est pas un utilisateur interne');
    }

    return userRepository.updateRole(id, newRole);
  }

  /**
   * Change client user role
   */
  /**
   * Change le rôle d'un utilisateur client
   */
  async changeClientRole(id, newRole, requestUser) {
    if (!CLIENT_ROLES.includes(newRole)) {
      throw ApiError.badRequest(`Le rôle doit être l'un des suivants: ${CLIENT_ROLES.join(', ')}`);
    }

    const user = await userRepository.findById(id);
    if (!user) throw ApiError.notFound('User');
    if (user.user_type !== 'client') {
      throw ApiError.badRequest('Cet utilisateur n\'est pas un utilisateur client');
    }

    return userRepository.updateRole(id, newRole);
  }

  /**
   * Activate / deactivate user
   */
  /**
   * Active / désactive un utilisateur
   */
  async updateStatus(id, isActive, requestUser) {
    const user = await userRepository.findById(id);
    if (!user) throw ApiError.notFound('User');

    if (id === requestUser.id && !isActive) {
      throw ApiError.badRequest('Vous ne pouvez pas désactiver votre propre compte');
    }

    return userRepository.updateStatus(id, isActive);
  }

  /**
   * Delete user (soft delete = deactivate)
   */
  async delete(id, requestUser) {
    const user = await userRepository.findById(id);
    if (!user) throw ApiError.notFound('User');

    // Empêche un utilisateur de se supprimer lui-même
    if (id === requestUser.id) {
      throw ApiError.badRequest('Vous ne pouvez pas supprimer votre propre compte');
    }

    return userRepository.delete(id);
  }
}

module.exports = new UserService();
