const crypto = require("crypto");

/**
 * Клас прикладної помилки для контрольованих помилок API.
 *
 * Дозволяє створювати помилки з:
 * - інформативним повідомленням;
 * - ключем локалізації;
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
   * @param {string} [messageKey] - Ключ локалізації повідомлення.
   */
  constructor(message, statusCode = 500, details = {}, messageKey = "common.internal") {
    super(message);

    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
    this.messageKey = messageKey;
    this.errorId = crypto.randomUUID();
    this.isOperational = statusCode < 500;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;