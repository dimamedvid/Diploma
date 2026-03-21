const crypto = require("crypto");
const { createModuleLogger } = require("../utils/logger");

const log = createModuleLogger("errorHandler");

/**
 * Видаляє чутливі поля з тіла запиту перед логуванням.
 *
 * Це потрібно для того, щоб не записувати у логи
 * паролі, токени або інші секретні дані.
 *
 * @param {Object} body - Тіло HTTP-запиту.
 * @returns {Object} Безпечна копія тіла запиту.
 */
function sanitizeBody(body = {}) {
  const sanitized = { ...body };

  if ("password" in sanitized) {
    sanitized.password = "[REDACTED]";
  }

  if ("token" in sanitized) {
    sanitized.token = "[REDACTED]";
  }

  return sanitized;
}

/**
 * Централізований middleware для обробки помилок Express.
 *
 * Логує необроблені помилки застосунку, додає:
 * - унікальний `errorId`;
 * - `requestId`;
 * - контекст користувача, сесії та запиту;
 * - технічну інформацію для діагностики.
 *
 * Для клієнта повертає уніфіковану JSON-відповідь.
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

  const statusCode = err.statusCode || 500;
  const errorId = err.errorId || crypto.randomUUID();
  const messageKey = err.messageKey || "common.internal";

  const context = {
    errorId,
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id || null,
    role: req.user?.role || null,
    sessionType: req.authContext?.sessionType || "anonymous",
    authType: req.authContext?.authType || "none",
    params: req.params,
    query: req.query,
    body: sanitizeBody(req.body),
    details: err.details || {},
    messageKey,
    errorMessage: err.message,
  };

  if (statusCode >= 500) {
    context.stack = err.stack;
    log.error("Unhandled application error", context);
  } else {
    log.warning("Handled application error", context);
  }

  return res.status(statusCode).json({
    success: false,
    errorId,
    requestId: req.requestId,
    messageKey,
    message:
      statusCode >= 500
        ? "Внутрішня помилка сервера. Спробуйте пізніше або зверніться до підтримки."
        : err.message,
    details: statusCode < 500 ? err.details || {} : {},
  });
}

module.exports = errorHandler;