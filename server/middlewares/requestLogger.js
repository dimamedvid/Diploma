const { createModuleLogger } = require("../utils/logger");

const log = createModuleLogger("request");

/**
 * Middleware для базового логування HTTP-запитів.
 *
 * Логує початок запиту та завершення відповіді,
 * включаючи метод, URL, статус-код і тривалість виконання.
 *
 * @param {Object} req - HTTP-запит Express.
 * @param {Object} res - HTTP-відповідь Express.
 * @param {Function} next - Функція переходу до наступного middleware.
 * @returns {void}
 */
function requestLogger(req, res, next) {
  const start = Date.now();

  log.info("HTTP request started", {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });

  res.on("finish", () => {
    const durationMs = Date.now() - start;

    const meta = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
    };

    if (res.statusCode >= 500) {
      log.error("HTTP request finished with server error", meta);
    } else if (res.statusCode >= 400) {
      log.warning("HTTP request finished with client error", meta);
    } else {
      log.info("HTTP request finished", meta);
    }
  });

  next();
}

module.exports = requestLogger;