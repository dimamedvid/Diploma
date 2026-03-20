const { verifyToken } = require("../utils/jwt");

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
 * 5. Якщо токен відсутній або недійсний, повертає відповідь з кодом 401.
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
    return res.status(401).json({ message: "No token" });
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

module.exports = { authMiddleware };