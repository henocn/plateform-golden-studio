'use strict';

/**
 * Format de réponse API standardisé (succès)
 *
 * {
 *   success: true,
 *   data: { ... },
 *   message: "...",
 *   meta: { page, limit, total, totalPages }  // optionnel
 * }
 */
class ApiResponse {
  /**
   * Réponse succès simple
   */
  static success(res, { data = null, message = 'Success', statusCode = 200, meta = null } = {}) {
    const response = {
      success: true,
      data,
      message,
    };

    if (meta) {
      response.meta = meta;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Réponse succès avec création (201)
   */
  static created(res, { data = null, message = 'Resource created successfully' } = {}) {
    return ApiResponse.success(res, { data, message, statusCode: 201 });
  }

  /**
   * Réponse succès paginée
   */
  static paginated(res, { data, page, limit, total, message = 'Success' } = {}) {
    const totalPages = Math.ceil(total / limit);

    return ApiResponse.success(res, {
      data,
      message,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  }

  /**
   * Réponse sans contenu (204)
   */
  static noContent(res) {
    return res.status(204).send();
  }
}

module.exports = ApiResponse;
