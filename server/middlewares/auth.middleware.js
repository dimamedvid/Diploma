const { verifyToken } = require("../utils/jwt");

/**
 * Middleware для перевірки JWT-токена в захищених маршрутах API.
 *
 * Очікує заголовок Authorization у форматі:
 * Bearer <token>
 *
 * Якщо токен валідний, у req.user записується декодований payload,
 * після чого керування передається наступному middleware або маршруту.
 * Якщо токен відсутній або недійсний, повертається відповідь 401.
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