const express = require("express");
const {
  deleteReadingProgress,
  getFavoriteGenres,
  getFavoriteWorkIds,
  getReadingProgress,
  saveFavoriteGenres,
  saveReadingProgress,
  toggleFavoriteWork,
} = require("../utils/userActivityDb");
const { authMiddleware } = require("../middlewares/auth.middleware");
const { createModuleLogger } = require("../utils/logger");
const AppError = require("../utils/AppError");

const router = express.Router();
const log = createModuleLogger("userActivity.routes");

/**
 * GET /api/me/favorites
 *
 * Повертає ID обраних творів користувача.
 */
router.get("/favorites", authMiddleware, async (req, res, next) => {
  try {
    const favoriteIds = await getFavoriteWorkIds(req.user.id);

    return res.json(favoriteIds);
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/me/favorites/:workId
 *
 * Додає або прибирає твір з обраного.
 */
router.post("/favorites/:workId", authMiddleware, async (req, res, next) => {
  try {
    const result = await toggleFavoriteWork(req.user.id, req.params.workId);

    log.info("Favorite work toggled", {
      requestId: req.requestId,
      userId: req.user.id,
      workId: req.params.workId,
      isFavorite: result.isFavorite,
    });

    return res.json(result);
  } catch (error) {
    if (error.code === "23503") {
      return next(
        new AppError(
          "Твір не знайдено.",
          404,
          { workId: req.params.workId },
          "favorites.workNotFound",
        ),
      );
    }

    return next(error);
  }
});

/**
 * GET /api/me/reading-progress
 *
 * Повертає прогрес читання користувача.
 */
router.get("/reading-progress", authMiddleware, async (req, res, next) => {
  try {
    const progress = await getReadingProgress(req.user.id);

    return res.json(progress);
  } catch (error) {
    return next(error);
  }
});

/**
 * PUT /api/me/reading-progress/:workId
 *
 * Зберігає поточну сторінку читання.
 */
router.put("/reading-progress/:workId", authMiddleware, async (req, res, next) => {
  try {
    const { currentPage } = req.body;

    if (!Number.isInteger(Number(currentPage)) || Number(currentPage) < 0) {
      throw new AppError(
        "Поточна сторінка має бути невід'ємним числом.",
        400,
        { field: "currentPage" },
        "readingProgress.invalidCurrentPage",
      );
    }

    const progress = await saveReadingProgress(
      req.user.id,
      req.params.workId,
      Number(currentPage),
    );

    log.info("Reading progress saved", {
      requestId: req.requestId,
      userId: req.user.id,
      workId: req.params.workId,
      currentPage: Number(currentPage),
    });

    return res.json(progress);
  } catch (error) {
    if (error.code === "23503") {
      return next(
        new AppError(
          "Твір не знайдено.",
          404,
          { workId: req.params.workId },
          "readingProgress.workNotFound",
        ),
      );
    }

    return next(error);
  }
});

/**
 * DELETE /api/me/reading-progress/:workId
 *
 * Видаляє прогрес читання твору.
 */
router.delete("/reading-progress/:workId", authMiddleware, async (req, res, next) => {
  try {
    await deleteReadingProgress(req.user.id, req.params.workId);

    log.info("Reading progress deleted", {
      requestId: req.requestId,
      userId: req.user.id,
      workId: req.params.workId,
    });

    return res.json({
      workId: String(req.params.workId),
      deleted: true,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/me/favorite-genres
 *
 * Повертає улюблені жанри користувача.
 */
router.get("/favorite-genres", authMiddleware, async (req, res, next) => {
  try {
    const genres = await getFavoriteGenres(req.user.id);

    return res.json(genres);
  } catch (error) {
    return next(error);
  }
});

/**
 * PUT /api/me/favorite-genres
 *
 * Зберігає улюблені жанри користувача.
 */
router.put("/favorite-genres", authMiddleware, async (req, res, next) => {
  try {
    const { genres } = req.body;

    if (!Array.isArray(genres)) {
      throw new AppError(
        "Список жанрів має бути масивом.",
        400,
        { field: "genres" },
        "favoriteGenres.invalidGenres",
      );
    }

    if (genres.length > 3) {
      throw new AppError(
        "Можна обрати не більше трьох улюблених жанрів.",
        400,
        { field: "genres" },
        "favoriteGenres.tooManyGenres",
      );
    }

    const savedGenres = await saveFavoriteGenres(req.user.id, genres);

    log.info("Favorite genres saved", {
      requestId: req.requestId,
      userId: req.user.id,
      genresCount: savedGenres.length,
    });

    return res.json(savedGenres);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;