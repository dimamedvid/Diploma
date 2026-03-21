const crypto = require("crypto");

/**
 * Middleware для генерації унікального ідентифікатора запиту.
 *
 * Для кожного HTTP-запиту створюється `requestId`,
 * який:
 * - зберігається у `req.requestId`;
 * - додається у відповідь через заголовок `X-Request-Id`.
 *
 * Це дозволяє пов'язати відповідь клієнту
 * з конкретним записом у логах.
 *
 * @param {Object} req - HTTP-запит Express.
 * @param {Object} res - HTTP-відповідь Express.
 * @param {Function} next - Функція переходу до наступного middleware.
 * @returns {void}
 */
function requestContext(req, res, next) {
  const requestId = crypto.randomUUID();

  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  next();
}

module.exports = requestContext;