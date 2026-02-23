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
   * Supports: success(res, data, message, statusCode) OR success(res, { data, message, statusCode, meta })
   */
  static success(res, dataOrOptions = null, message = 'Success', statusCode = 200) {
    let data = null;
    let meta = null;

    // Detect if called with options object pattern: success(res, { data, message, ... })
    if (
      dataOrOptions !== null
      && typeof dataOrOptions === 'object'
      && !Array.isArray(dataOrOptions)
      && ('data' in dataOrOptions || 'message' in dataOrOptions || 'statusCode' in dataOrOptions || 'meta' in dataOrOptions)
      && arguments.length === 2
    ) {
      ({ data = null, message = 'Success', statusCode = 200, meta = null } = dataOrOptions);
    } else {
      data = dataOrOptions;
    }

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
  static created(res, data = null, message = 'Ressource créée') {
    return ApiResponse.success(res, data, message, 201);
  }

  /**
   * Réponse succès paginée
   */
  static paginated(res, { data, page, limit, total, message = 'Succès' } = {}) {
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
