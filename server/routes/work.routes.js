const express = require("express");
const {
  approveWorkById,
  createWork,
  getPendingWorksForModeration,
  getPublishedWorks,
  getWorkById,
  getWorksByAuthorId,
  rejectWorkById,
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
 * @openapi
 * /api/works:
 *   get:
 *     tags:
 *       - Works
 *     summary: Отримання списку опублікованих творів
 *     description: Повертає список творів зі статусом approved без повного тексту сторінок.
 *     responses:
 *       "200":
 *         description: Список творів успішно отримано.
 */

/**
 * GET /api/works
 *
 * Повертає список опублікованих творів.
 *
 * @param {Object} req - HTTP-запит Express.
 * @param {Object} res - HTTP-відповідь Express.
 * @param {Function} next - Функція передачі помилки.
 * @returns {Promise<Object|void>} JSON-список творів.
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
 * @openapi
 * /api/works/moderation/pending:
 *   get:
 *     tags:
 *       - Works
 *     summary: Отримання творів на модерації
 *     description: Повертає список творів зі статусом pending разом зі сторінками. Доступно тільки модератору або адміністратору.
 *     responses:
 *       "200":
 *         description: Список творів на модерації успішно отримано.
 *       "401":
 *         description: Користувач не авторизований.
 *       "403":
 *         description: Недостатньо прав.
 */

/**
 * GET /api/works/moderation/pending
 *
 * Повертає твори, які очікують модерації.
 *
 * @param {Object} req - HTTP-запит Express.
 * @param {Object} res - HTTP-відповідь Express.
 * @param {Function} next - Функція передачі помилки.
 * @returns {Promise<Object|void>} JSON-список pending-творів.
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
 * @openapi
 * /api/works/my:
 *   get:
 *     tags:
 *       - Works
 *     summary: Отримання власних творів користувача
 *     description: Повертає всі твори поточного авторизованого користувача зі статусами pending, approved або rejected.
 *     responses:
 *       "200":
 *         description: Список власних творів успішно отримано.
 *       "401":
 *         description: Користувач не авторизований.
 */

/**
 * GET /api/works/my
 *
 * Повертає твори поточного авторизованого користувача.
 *
 * @param {Object} req - HTTP-запит Express.
 * @param {Object} res - HTTP-відповідь Express.
 * @param {Function} next - Функція передачі помилки.
 * @returns {Promise<Object|void>} JSON-список творів користувача.
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
 * @openapi
 * /api/works/{id}:
 *   get:
 *     tags:
 *       - Works
 *     summary: Отримання одного твору
 *     description: Повертає один твір разом із масивом сторінок.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID твору.
 *     responses:
 *       "200":
 *         description: Твір успішно отримано.
 *       "404":
 *         description: Твір не знайдено.
 */

/**
 * GET /api/works/:id
 *
 * Повертає один твір разом зі сторінками.
 *
 * @param {Object} req - HTTP-запит Express.
 * @param {Object} res - HTTP-відповідь Express.
 * @param {Function} next - Функція передачі помилки.
 * @returns {Promise<Object|void>} JSON-об'єкт твору.
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
 * @openapi
 * /api/works:
 *   post:
 *     tags:
 *       - Works
 *     summary: Створення нового твору
 *     description: Створює новий твір зі статусом pending. Доступно тільки авторизованому користувачу.
 *     responses:
 *       "201":
 *         description: Твір створено і відправлено на модерацію.
 *       "400":
 *         description: Некоректні дані твору.
 *       "401":
 *         description: Користувач не авторизований.
 */

/**
 * POST /api/works
 *
 * Створює новий твір і відправляє його на модерацію.
 *
 * @param {Object} req - HTTP-запит Express.
 * @param {Object} res - HTTP-відповідь Express.
 * @param {Function} next - Функція передачі помилки.
 * @returns {Promise<Object|void>} JSON-об'єкт створеного твору.
 */
router.post("/", authMiddleware, async (req, res, next) => {
  try {
    const { title, genre, description, cover, pages } = req.body;

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

    const author =
      `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim() ||
      req.user.login;

    const work = await createWork({
      title: title.trim(),
      author,
      authorId: req.user.id,
      genre: genre.trim(),
      description: description.trim(),
      cover: isNonEmptyString(cover) ? cover.trim() : "",
      pages: pages.map((page) => page.trim()),
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
 * @openapi
 * /api/works/{id}/approve:
 *   patch:
 *     tags:
 *       - Works
 *     summary: Підтвердження твору
 *     description: Переводить твір зі статусу pending у статус approved. Доступно тільки модератору або адміністратору.
 *     responses:
 *       "200":
 *         description: Твір підтверджено.
 *       "404":
 *         description: Твір не знайдено або він не очікує модерації.
 */

/**
 * PATCH /api/works/:id/approve
 *
 * Підтверджує твір.
 *
 * @param {Object} req - HTTP-запит Express.
 * @param {Object} res - HTTP-відповідь Express.
 * @param {Function} next - Функція передачі помилки.
 * @returns {Promise<Object|void>} JSON-об'єкт підтвердженого твору.
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
 * @openapi
 * /api/works/{id}/reject:
 *   patch:
 *     tags:
 *       - Works
 *     summary: Відхилення твору
 *     description: Переводить твір зі статусу pending у статус rejected із причиною відхилення. Доступно тільки модератору або адміністратору.
 *     responses:
 *       "200":
 *         description: Твір відхилено.
 *       "400":
 *         description: Причина відхилення не вказана.
 *       "404":
 *         description: Твір не знайдено або він не очікує модерації.
 */

/**
 * PATCH /api/works/:id/reject
 *
 * Відхиляє твір із причиною.
 *
 * @param {Object} req - HTTP-запит Express.
 * @param {Object} res - HTTP-відповідь Express.
 * @param {Function} next - Функція передачі помилки.
 * @returns {Promise<Object|void>} JSON-об'єкт відхиленого твору.
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