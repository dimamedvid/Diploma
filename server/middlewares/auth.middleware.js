const { verifyToken } = require("../utils/jwt");
const { createModuleLogger } = require("../utils/logger");
const AppError = require("../utils/AppError");

const log = createModuleLogger("auth.middleware");

/**
 * Middleware авторизації для захищених маршрутів API.
 *
 * Модуль містить middleware, який перевіряє наявність і валідність
 * JWT-токена в заголовку `Authorization` запиту.
 * У разі успішної перевірки дані користувача з токена
 * зберігаються у `req.user`.
 */

/**
 * Перевіряє JWT-токен у заголовку Authorization.
 *
 * Очікує заголовок у форматі:
 * `Bearer <token>`
 *
 * Алгоритм роботи:
 * 1. Зчитує заголовок `Authorization`.
 * 2. Перевіряє, чи має він формат `Bearer <token>`.
 * 3. Викликає `verifyToken()` для декодування і перевірки токена.
 * 4. Якщо токен валідний, записує payload у `req.user`.
 * 5. Додає auth/session context у `req.authContext`.
 * 6. Якщо токен відсутній або недійсний, передає контрольовану помилку далі.
 *
 * @param {Object} req - HTTP-запит Express.
 * @param {Object} req.headers - Заголовки запиту.
 * @param {Object} res - HTTP-відповідь Express.
 * @param {Function} next - Функція переходу до наступного middleware.
 * @returns {void}
 */
function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    req.authContext = {
      sessionType: "anonymous",
      authType: "none",
    };

    log.warning("Authorization failed: no token provided", {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    return next(
      new AppError("Для доступу до цього ресурсу потрібно увійти в систему.", 401, {
        reason: "NO_TOKEN",
      }),
    );
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    req.authContext = {
      sessionType: "jwt",
      authType: "bearer",
      userId: payload.id,
      role: payload.role,
    };

    log.debug("Token verified successfully", {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      userId: payload.id,
      role: payload.role,
      sessionType: "jwt",
    });

    return next();
  } catch (error) {
    req.authContext = {
      sessionType: "invalid-jwt",
      authType: "bearer",
    };

    log.warning("Authorization failed: invalid token", {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      errorMessage: error.message,
    });

    return next(
      new AppError("Сесія недійсна або завершилась. Увійдіть у систему повторно.", 401, {
        reason: "INVALID_TOKEN",
      }),
    );
  }
}

module.exports = { authMiddleware };