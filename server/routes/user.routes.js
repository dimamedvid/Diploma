const express = require("express");
const { getUserProfileById } = require("../utils/userProfileDb");
const { createModuleLogger } = require("../utils/logger");
const AppError = require("../utils/AppError");

const router = express.Router();
const log = createModuleLogger("user.routes");

/**
 * GET /api/users/:id/profile
 *
 * Повертає публічний профіль користувача та його опубліковані твори.
 */
router.get("/:id/profile", async (req, res, next) => {
  try {
    const { id } = req.params;

    const profile = await getUserProfileById(id);

    if (!profile) {
      throw new AppError(
        "Користувача не знайдено.",
        404,
        { userId: id },
        "users.notFound",
      );
    }

    log.info("User profile requested", {
      requestId: req.requestId,
      userId: id,
    });

    return res.json(profile);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;