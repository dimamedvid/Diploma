/* eslint-disable jsdoc/check-tag-names */

const express = require("express");
const { getUserProfileById } = require("../utils/userProfileDb");
const { createModuleLogger } = require("../utils/logger");
const AppError = require("../utils/AppError");

const router = express.Router();
const log = createModuleLogger("user.routes");

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Публічні профілі користувачів
 */

/**
 * @swagger
 * /api/users/{id}/profile:
 *   get:
 *     summary: Отримати публічний профіль користувача
 *     description: Повертає відкриту інформацію про користувача, його опубліковані твори та базову статистику профілю.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID користувача
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Публічний профіль користувача успішно отримано
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "1"
 *                     login:
 *                       type: string
 *                       example: "poto7"
 *                     firstName:
 *                       type: string
 *                       example: "Дмитро"
 *                     lastName:
 *                       type: string
 *                       example: "Медвідь"
 *                     fullName:
 *                       type: string
 *                       example: "Дмитро Медвідь"
 *                     role:
 *                       type: string
 *                       example: "user"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-05-21T12:34:56.000Z"
 *                 works:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "5"
 *                       title:
 *                         type: string
 *                         example: "Назва твору"
 *                       author:
 *                         type: string
 *                         example: "Дмитро Медвідь"
 *                       authorId:
 *                         type: string
 *                         example: "1"
 *                       genre:
 *                         type: string
 *                         example: "Фантастика"
 *                       description:
 *                         type: string
 *                         example: "Короткий опис твору"
 *                       cover:
 *                         type: string
 *                         example: "https://example.com/cover.jpg"
 *                       status:
 *                         type: string
 *                         example: "approved"
 *                       rating:
 *                         type: number
 *                         example: 4.5
 *                       ratingsCount:
 *                         type: number
 *                         example: 3
 *                       submittedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       approvedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       rejectedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       rejectionReason:
 *                         type: string
 *                         nullable: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                 stats:
 *                   type: object
 *                   properties:
 *                     worksCount:
 *                       type: number
 *                       example: 2
 *                     commentsCount:
 *                       type: number
 *                       example: 5
 *                     favoriteWorksCount:
 *                       type: number
 *                       example: 4
 *       404:
 *         description: Користувача не знайдено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Користувача не знайдено.
 *                 details:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       example: "999"
 *       500:
 *         description: Внутрішня помилка сервера
 */

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