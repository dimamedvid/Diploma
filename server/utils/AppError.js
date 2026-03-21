const crypto = require("crypto");

/**
 * Клас прикладної помилки для контрольованих помилок API.
 *
 * Дозволяє створювати помилки з:
 * - інформативним повідомленням;
 * - HTTP-статусом;
 * - унікальним ідентифікатором помилки;
 * - додатковим контекстом.
 */
class AppError extends Error {
  /**
   * Створює новий екземпляр помилки застосунку.
   *
   * @param {string} message - Зрозуміле повідомлення про помилку.
   * @param {number} [statusCode] - HTTP-статус помилки.
   * @param {Object} [details] - Додаткові деталі або контекст помилки.
   */
  constructor(message, statusCode = 500, details = {}) {
    super(message);

    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
    this.errorId = crypto.randomUUID();
    this.isOperational = statusCode < 500;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;