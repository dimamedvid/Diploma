const express = require("express");
const {
  deleteOwnComment,
  getCommentsByUserId,
  toggleCommentLike,
  updateOwnComment,
} = require("../utils/commentDb");
const { authMiddleware } = require("../middlewares/auth.middleware");
const { createModuleLogger } = require("../utils/logger");
const AppError = require("../utils/AppError");

const router = express.Router();
const log = createModuleLogger("comment.routes");

/**
 * Перевіряє, чи рядок не є порожнім.
 *
 * @param {unknown} value - Значення для перевірки.
 * @returns {boolean} true, якщо це непорожній рядок.
 */
function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Перевіряє коректність оцінки.
 *
 * @param {unknown} rating - Оцінка.
 * @returns {boolean} true, якщо оцінка від 1 до 5.
 */
function isValidRating(rating) {
  const numberRating = Number(rating);

  return Number.isInteger(numberRating) && numberRating >= 1 && numberRating <= 5;
}

/**
 * GET /api/comments/my
 *
 * Повертає всі коментарі поточного користувача.
 */
router.get("/my", authMiddleware, async (req, res, next) => {
  try {
    const comments = await getCommentsByUserId(req.user.id);

    log.info("Current user comments requested", {
      requestId: req.requestId,
      userId: req.user.id,
      count: comments.length,
    });

    return res.json(comments);
  } catch (error) {
    return next(error);
  }
});

/**
 * PUT /api/comments/:id
 *
 * Редагує власний коментар користувача.
 */
router.put("/:id", authMiddleware, async (req, res, next) => {
  try {
    const { text, rating } = req.body;

    if (!isNonEmptyString(text)) {
      throw new AppError(
        "Текст коментаря є обов'язковим.",
        400,
        { field: "text" },
        "comments.textRequired",
      );
    }

    if (!isValidRating(rating)) {
      throw new AppError(
        "Оцінка має бути числом від 1 до 5.",
        400,
        { field: "rating" },
        "comments.invalidRating",
      );
    }

    const updatedComment = await updateOwnComment(req.params.id, req.user.id, {
      text: text.trim(),
      rating: Number(rating),
    });

    if (!updatedComment) {
      throw new AppError(
        "Коментар не знайдено або ви не маєте прав для його редагування.",
        404,
        { commentId: req.params.id },
        "comments.updateNotFound",
      );
    }

    log.info("Comment updated", {
      requestId: req.requestId,
      commentId: updatedComment.id,
      userId: req.user.id,
    });

    return res.json(updatedComment);
  } catch (error) {
    return next(error);
  }
});

/**
 * DELETE /api/comments/:id
 *
 * Видаляє власний коментар користувача.
 */
router.delete("/:id", authMiddleware, async (req, res, next) => {
  try {
    const isDeleted = await deleteOwnComment(req.params.id, req.user.id);

    if (!isDeleted) {
      throw new AppError(
        "Коментар не знайдено або ви не маєте прав для його видалення.",
        404,
        { commentId: req.params.id },
        "comments.deleteNotFound",
      );
    }

    log.info("Comment deleted", {
      requestId: req.requestId,
      commentId: req.params.id,
      userId: req.user.id,
    });

    return res.json({
      id: String(req.params.id),
      deleted: true,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/comments/:id/like
 *
 * Додає або прибирає лайк з коментаря.
 */
router.post("/:id/like", authMiddleware, async (req, res, next) => {
  try {
    const updatedComment = await toggleCommentLike(req.params.id, req.user.id);

    if (!updatedComment) {
      throw new AppError(
        "Коментар не знайдено.",
        404,
        { commentId: req.params.id },
        "comments.notFound",
      );
    }

    log.info("Comment like toggled", {
      requestId: req.requestId,
      commentId: updatedComment.id,
      userId: req.user.id,
    });

    return res.json(updatedComment);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;