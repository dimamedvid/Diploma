const express = require("express");
const {
  approveWorkById,
  createWork,
  deleteOwnWorkById,
  getPendingWorksForModeration,
  getPublishedWorks,
  getWorkById,
  getWorksByAuthorId,
  rejectWorkById,
  updateOwnWorkById,
} = require("../utils/workDb");
const { authMiddleware } = require("../middlewares/auth.middleware");
const { createModuleLogger } = require("../utils/logger");
const AppError = require("../utils/AppError");

const router = express.Router();
const log = createModuleLogger("work.routes");

/**
 * Перевіряє, чи рядок не є порожнім.
 *
 * @param {unknown} value - Значення для перевірки.
 * @returns {boolean} true, якщо значення є непорожнім рядком.
 */
function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Перевіряє, чи масив сторінок коректний.
 *
 * @param {unknown} pages - Сторінки твору.
 * @returns {boolean} true, якщо сторінки є непорожнім масивом рядків.
 */
function arePagesValid(pages) {
  return (
    Array.isArray(pages) &&
    pages.length > 0 &&
    pages.every((page) => isNonEmptyString(page))
  );
}

/**
 * Перевіряє, чи користувач є модератором або адміністратором.
 *
 * @param {Object} req - HTTP-запит Express.
 * @param {Object} req.user - Дані користувача з JWT.
 * @param {Object} res - HTTP-відповідь Express.
 * @param {Function} next - Функція переходу до наступного middleware.
 * @returns {void}
 */
function moderatorOnly(req, res, next) {
  const allowedRoles = ["moderator", "admin"];

  if (!allowedRoles.includes(req.user?.role)) {
    return next(
      new AppError(
        "У вас немає прав для виконання цієї дії.",
        403,
        { role: req.user?.role || null },
        "auth.forbidden",
      ),
    );
  }

  return next();
}

/**
 * Валідує основні поля твору.
 *
 * @param {Object} body - Тіло запиту.
 * @returns {{ title: string, genre: string, description: string, cover: string, pages: string[] }} Нормалізовані дані.
 * @throws {AppError} Якщо дані некоректні.
 */
function validateWorkBody(body) {
  const { title, genre, description, cover, pages } = body;

  if (!isNonEmptyString(title)) {
    throw new AppError(
      "Назва твору є обов'язковою.",
      400,
      { field: "title" },
      "works.titleRequired",
    );
  }

  if (!isNonEmptyString(genre)) {
    throw new AppError(
      "Жанр твору є обов'язковим.",
      400,
      { field: "genre" },
      "works.genreRequired",
    );
  }

  if (!isNonEmptyString(description)) {
    throw new AppError(
      "Опис твору є обов'язковим.",
      400,
      { field: "description" },
      "works.descriptionRequired",
    );
  }

  if (!arePagesValid(pages)) {
    throw new AppError(
      "Твір має містити хоча б одну сторінку тексту.",
      400,
      { field: "pages" },
      "works.pagesRequired",
    );
  }

  return {
    title: title.trim(),
    genre: genre.trim(),
    description: description.trim(),
    cover: isNonEmptyString(cover) ? cover.trim() : "",
    pages: pages.map((page) => page.trim()),
  };
}

/**
 * GET /api/works
 *
 * Повертає список опублікованих творів.
 */
router.get("/", async (req, res, next) => {
  try {
    log.info("Published works requested", {
      requestId: req.requestId,
    });

    const works = await getPublishedWorks();

    return res.json(works);
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/works/moderation/pending
 *
 * Повертає твори, які очікують модерації.
 */
router.get(
  "/moderation/pending",
  authMiddleware,
  moderatorOnly,
  async (req, res, next) => {
    try {
      const works = await getPendingWorksForModeration();

      log.info("Pending works requested", {
        requestId: req.requestId,
        moderatorId: req.user.id,
        count: works.length,
      });

      return res.json(works);
    } catch (error) {
      return next(error);
    }
  },
);

/**
 * GET /api/works/my
 *
 * Повертає твори поточного авторизованого користувача.
 */
router.get("/my", authMiddleware, async (req, res, next) => {
  try {
    const works = await getWorksByAuthorId(req.user.id);

    log.info("Current user works requested", {
      requestId: req.requestId,
      authorId: req.user.id,
      count: works.length,
    });

    return res.json(works);
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/works/:id
 *
 * Повертає один твір разом зі сторінками.
 */
router.get("/:id", async (req, res, next) => {
  try {
    const work = await getWorkById(req.params.id);

    if (!work) {
      throw new AppError(
        "Твір не знайдено.",
        404,
        { workId: req.params.id },
        "works.notFound",
      );
    }

    return res.json(work);
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/works
 *
 * Створює новий твір і відправляє його на модерацію.
 */
router.post("/", authMiddleware, async (req, res, next) => {
  try {
    const workData = validateWorkBody(req.body);

    const author =
      `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim() ||
      req.user.login;

    const work = await createWork({
      ...workData,
      author,
      authorId: req.user.id,
    });

    log.info("Work created and sent to moderation", {
      requestId: req.requestId,
      workId: work.id,
      authorId: req.user.id,
    });

    return res.status(201).json(work);
  } catch (error) {
    return next(error);
  }
});

/**
 * PUT /api/works/:id
 *
 * Редагує власний твір користувача.
 *
 * Після редагування твір знову переходить на модерацію.
 */
router.put("/:id", authMiddleware, async (req, res, next) => {
  try {
    const workData = validateWorkBody(req.body);

    const updatedWork = await updateOwnWorkById(
      req.params.id,
      req.user.id,
      workData,
    );

    if (!updatedWork) {
      throw new AppError(
        "Твір не знайдено або ви не маєте прав для його редагування.",
        404,
        { workId: req.params.id },
        "works.updateNotFound",
      );
    }

    log.info("Work updated and returned to moderation", {
      requestId: req.requestId,
      workId: updatedWork.id,
      authorId: req.user.id,
    });

    return res.json(updatedWork);
  } catch (error) {
    return next(error);
  }
});

/**
 * DELETE /api/works/:id
 *
 * Видаляє власний твір користувача.
 */
router.delete("/:id", authMiddleware, async (req, res, next) => {
  try {
    const isDeleted = await deleteOwnWorkById(req.params.id, req.user.id);

    if (!isDeleted) {
      throw new AppError(
        "Твір не знайдено або ви не маєте прав для його видалення.",
        404,
        { workId: req.params.id },
        "works.deleteNotFound",
      );
    }

    log.info("Work deleted", {
      requestId: req.requestId,
      workId: req.params.id,
      authorId: req.user.id,
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
 * PATCH /api/works/:id/approve
 *
 * Підтверджує твір.
 */
router.patch(
  "/:id/approve",
  authMiddleware,
  moderatorOnly,
  async (req, res, next) => {
    try {
      const approvedWork = await approveWorkById(req.params.id);

      if (!approvedWork) {
        throw new AppError(
          "Твір не знайдено або він не очікує модерації.",
          404,
          { workId: req.params.id },
          "works.approveNotFound",
        );
      }

      log.info("Work approved", {
        requestId: req.requestId,
        workId: approvedWork.id,
        moderatorId: req.user.id,
      });

      return res.json(approvedWork);
    } catch (error) {
      return next(error);
    }
  },
);

/**
 * PATCH /api/works/:id/reject
 *
 * Відхиляє твір із причиною.
 */
router.patch(
  "/:id/reject",
  authMiddleware,
  moderatorOnly,
  async (req, res, next) => {
    try {
      const { reason } = req.body;

      if (!isNonEmptyString(reason)) {
        throw new AppError(
          "Вкажіть причину відхилення твору.",
          400,
          { field: "reason" },
          "works.rejectionReasonRequired",
        );
      }

      const rejectedWork = await rejectWorkById(req.params.id, reason.trim());

      if (!rejectedWork) {
        throw new AppError(
          "Твір не знайдено або він не очікує модерації.",
          404,
          { workId: req.params.id },
          "works.rejectNotFound",
        );
      }

      log.info("Work rejected", {
        requestId: req.requestId,
        workId: rejectedWork.id,
        moderatorId: req.user.id,
      });

      return res.json(rejectedWork);
    } catch (error) {
      return next(error);
    }
  },
);

module.exports = router;