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
      throw ApiError.badRequest(`Role must be one of: ${INTERNAL_ROLES.join(', ')}`);
    }

    // Check email uniqueness
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw ApiError.conflict('A user with this email already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(data.password, salt);

    return userRepository.create({
      ...data,
      password_hash,
      user_type: 'internal',
      organization_id: null,
      created_by: createdBy,
    });
  }

  /**
   * Create client user
   * - internal admin+ can create for any org
   * - client_admin can create only within their own org
   */
  async createClient(data, requestUser) {
    // Validate role is client
    if (!CLIENT_ROLES.includes(data.role)) {
      throw ApiError.badRequest(`Role must be one of: ${CLIENT_ROLES.join(', ')}`);
    }

    if (!data.organization_id) {
      throw ApiError.badRequest('organization_id is required for client users');
    }

    // If requestUser is client_admin, ensure they can only create in their own org
    if (requestUser.user_type === 'client') {
      if (data.organization_id !== requestUser.organization_id) {
        throw ApiError.unauthorizedOrgAccess();
      }
    }

    // Check email uniqueness
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw ApiError.conflict('A user with this email already exists');
    }

    // Hash password
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
   * Update user profile
   */
  async update(id, data, requestUser) {
    const user = await userRepository.findById(id);
    if (!user) throw ApiError.notFound('User');

    // Client users can only update users within their own organization
    if (requestUser.user_type === 'client') {
      if (user.organization_id !== requestUser.organization_id) {
        throw ApiError.unauthorizedOrgAccess();
      }
    }

    // Never allow updating email, password, role, user_type through this endpoint
    const { email, password, role, user_type, password_hash, ...safeData } = data;

    return userRepository.update(id, safeData);
  }

  /**
   * Change internal user role (super_admin only)
   */
  async changeInternalRole(id, newRole) {
    if (!INTERNAL_ROLES.includes(newRole)) {
      throw ApiError.badRequest(`Role must be one of: ${INTERNAL_ROLES.join(', ')}`);
    }

    const user = await userRepository.findById(id);
    if (!user) throw ApiError.notFound('User');
    if (user.user_type !== 'internal') {
      throw ApiError.badRequest('This user is not an internal user');
    }

    return userRepository.updateRole(id, newRole);
  }

  /**
   * Change client user role
   */
  async changeClientRole(id, newRole, requestUser) {
    if (!CLIENT_ROLES.includes(newRole)) {
      throw ApiError.badRequest(`Role must be one of: ${CLIENT_ROLES.join(', ')}`);
    }

    const user = await userRepository.findById(id);
    if (!user) throw ApiError.notFound('User');
    if (user.user_type !== 'client') {
      throw ApiError.badRequest('This user is not a client user');
    }

    // client_admin can only change roles within their own org
    if (requestUser.user_type === 'client') {
      if (user.organization_id !== requestUser.organization_id) {
        throw ApiError.unauthorizedOrgAccess();
      }
    }

    return userRepository.updateRole(id, newRole);
  }

  /**
   * Activate / deactivate user
   */
  async updateStatus(id, isActive, requestUser) {
    const user = await userRepository.findById(id);
    if (!user) throw ApiError.notFound('User');

    // Prevent self-deactivation
    if (id === requestUser.id && !isActive) {
      throw ApiError.badRequest('You cannot deactivate your own account');
    }

    // client_admin can only manage their own org
    if (requestUser.user_type === 'client') {
      if (user.organization_id !== requestUser.organization_id) {
        throw ApiError.unauthorizedOrgAccess();
      }
    }

    return userRepository.updateStatus(id, isActive);
  }

  /**
   * Delete user (soft delete = deactivate)
   */
  async delete(id, requestUser) {
    return this.updateStatus(id, false, requestUser);
  }
}

module.exports = new UserService();
