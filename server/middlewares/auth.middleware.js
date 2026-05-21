const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

/**
 * Middleware для перевірки JWT авторизації.
 *
 * Очікує header:
 * Authorization: Bearer <token>
 *
 * Після успішної перевірки додає користувача в req.user.
 *
 * @param {Object} req - Express request.
 * @param {Object} res - Express response.
 * @param {Function} next - Express next.
 * @returns {void}
 */
function authMiddleware(req, res, next) {
  try {
    const authorization = req.headers.authorization || "";
    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      return next(
        new AppError(
          "Токен авторизації не передано.",
          401,
          { reason: "NO_TOKEN" },
          "auth.noToken",
        ),
      );
    }

    const payload = jwt.verify(token, JWT_SECRET);

    req.user = {
      id: String(payload.id),
      login: payload.login,
      email: payload.email,
      firstName: payload.firstName || "",
      lastName: payload.lastName || "",
      role: payload.role || "user",
    };

    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(
        new AppError(
          "Термін дії токена завершився.",
          401,
          { reason: "TOKEN_EXPIRED" },
          "auth.tokenExpired",
        ),
      );
    }

    if (error.name === "JsonWebTokenError") {
      return next(
        new AppError(
          "Некоректний токен авторизації.",
          401,
          { reason: "INVALID_TOKEN" },
          "auth.invalidToken",
        ),
      );
    }

    return next(error);
  }
}

module.exports = {
  authMiddleware,
};