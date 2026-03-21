const { createModuleLogger } = require("../utils/logger");

const log = createModuleLogger("errorHandler");

/**
 * Централізований middleware для обробки помилок Express.
 *
 * Логує необроблені помилки застосунку та повертає
 * контрольовану JSON-відповідь клієнту.
 *
 * @param {Error} err - Об'єкт помилки.
 * @param {Object} req - HTTP-запит Express.
 * @param {Object} res - HTTP-відповідь Express.
 * @param {Function} next - Функція переходу до наступного middleware.
 * @returns {Object|void} JSON-відповідь з помилкою або передача помилки далі.
 */
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  log.error("Unhandled application error", {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    errorMessage: err.message,
    stack: err.stack,
  });

  return res.status(err.statusCode || 500).json({
    message:
      err.statusCode && err.statusCode < 500
        ? err.message
        : "Внутрішня помилка сервера",
  });
}

module.exports = errorHandler;