const express = require("express");
const { getAdminStats } = require("../utils/adminStatsDb");
const { authMiddleware } = require("../middlewares/auth.middleware");
const { createModuleLogger } = require("../utils/logger");
const AppError = require("../utils/AppError");

const router = express.Router();
const log = createModuleLogger("adminStats.routes");

/**
 * Перевіряє, чи користувач є модератором або адміністратором.
 *
 * @param {Object} req - HTTP-запит Express.
 * @param {Object} res - HTTP-відповідь Express.
 * @param {Function} next - Функція переходу до наступного middleware.
 * @returns {void}
 */
function moderatorOnly(req, res, next) {
  const allowedRoles = ["moderator", "admin"];

  if (!allowedRoles.includes(req.user?.role)) {
    return next(
      new AppError(
        "У вас немає прав для перегляду статистики.",
        403,
        { role: req.user?.role || null },
        "adminStats.forbidden",
      ),
    );
  }

  return next();
}

/**
 * GET /api/admin/stats
 *
 * Повертає статистику системи для модератора або адміністратора.
 */
router.get("/stats", authMiddleware, moderatorOnly, async (req, res, next) => {
  try {
    const stats = await getAdminStats();

    log.info("Admin stats requested", {
      requestId: req.requestId,
      userId: req.user.id,
      role: req.user.role,
    });

    return res.json(stats);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;