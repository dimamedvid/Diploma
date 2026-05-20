const { query } = require("./db");

/**
 * Перетворює рядок коментаря з PostgreSQL у формат для frontend.
 *
 * @param {Object} row - Рядок з бази даних.
 * @returns {Object} Коментар у camelCase форматі.
 */
function mapCommentRow(row) {
  return {
    id: String(row.id),
    workId: String(row.work_id),
    userId: row.user_id,
    author: row.author,
    text: row.text,
    rating: Number(row.rating),
    likedBy: row.liked_by || [],
    likesCount: Number(row.likes_count || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Перетворює коментар користувача з даними твору у формат для кабінету.
 *
 * @param {Object} row - Рядок з бази даних.
 * @returns {Object} Коментар з інформацією про твір.
 */
function mapUserCommentRow(row) {
  return {
    ...mapCommentRow(row),
    workTitle: row.work_title,
    workAuthor: row.work_author,
  };
}

/**
 * Повертає всі коментарі до твору.
 *
 * @param {number|string} workId - ID твору.
 * @returns {Promise<Object[]>} Список коментарів.
 */
async function getCommentsByWorkId(workId) {
  const result = await query(
    `
      SELECT
        comments.id,
        comments.work_id,
        comments.user_id,
        comments.author,
        comments.text,
        comments.rating,
        comments.created_at,
        comments.updated_at,
        COALESCE(
          ARRAY_AGG(comment_likes.user_id)
          FILTER (WHERE comment_likes.user_id IS NOT NULL),
          '{}'
        ) AS liked_by,
        COUNT(comment_likes.id) AS likes_count
      FROM comments
      LEFT JOIN comment_likes
        ON comments.id = comment_likes.comment_id
      WHERE comments.work_id = $1
      GROUP BY comments.id
      ORDER BY comments.created_at DESC, comments.id DESC
    `,
    [workId],
  );

  return result.rows.map(mapCommentRow);
}

/**
 * Повертає всі коментарі поточного користувача.
 *
 * Використовується для блоку "Мої коментарі та оцінки" в кабінеті.
 *
 * @param {string} userId - ID користувача.
 * @returns {Promise<Object[]>} Список коментарів користувача.
 */
async function getCommentsByUserId(userId) {
  const result = await query(
    `
      SELECT
        comments.id,
        comments.work_id,
        comments.user_id,
        comments.author,
        comments.text,
        comments.rating,
        comments.created_at,
        comments.updated_at,
        works.title AS work_title,
        works.author AS work_author,
        COALESCE(
          ARRAY_AGG(comment_likes.user_id)
          FILTER (WHERE comment_likes.user_id IS NOT NULL),
          '{}'
        ) AS liked_by,
        COUNT(comment_likes.id) AS likes_count
      FROM comments
      INNER JOIN works
        ON comments.work_id = works.id
      LEFT JOIN comment_likes
        ON comments.id = comment_likes.comment_id
      WHERE comments.user_id = $1
      GROUP BY comments.id, works.title, works.author
      ORDER BY comments.created_at DESC, comments.id DESC
    `,
    [userId],
  );

  return result.rows.map(mapUserCommentRow);
}

/**
 * Створює коментар до твору.
 *
 * Один користувач може залишити тільки один коментар до одного твору.
 *
 * @param {Object} commentData - Дані коментаря.
 * @param {number|string} commentData.workId - ID твору.
 * @param {string} commentData.userId - ID користувача.
 * @param {string} commentData.author - Автор коментаря.
 * @param {string} commentData.text - Текст коментаря.
 * @param {number} commentData.rating - Оцінка.
 * @returns {Promise<Object>} Створений коментар.
 */
async function createComment(commentData) {
  const { workId, userId, author, text, rating } = commentData;

  const result = await query(
    `
      INSERT INTO comments (
        work_id,
        user_id,
        author,
        text,
        rating
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id,
        work_id,
        user_id,
        author,
        text,
        rating,
        created_at,
        updated_at,
        '{}'::VARCHAR[] AS liked_by,
        0 AS likes_count
    `,
    [workId, userId, author, text, rating],
  );

  return mapCommentRow(result.rows[0]);
}

/**
 * Редагує власний коментар користувача.
 *
 * @param {number|string} commentId - ID коментаря.
 * @param {string} userId - ID користувача.
 * @param {Object} commentData - Нові дані.
 * @param {string} commentData.text - Новий текст.
 * @param {number} commentData.rating - Нова оцінка.
 * @returns {Promise<Object|null>} Оновлений коментар або null.
 */
async function updateOwnComment(commentId, userId, commentData) {
  const { text, rating } = commentData;

  const result = await query(
    `
      UPDATE comments
      SET
        text = $1,
        rating = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND user_id = $4
      RETURNING work_id
    `,
    [text, rating, commentId, userId],
  );

  if (result.rows.length === 0) {
    return null;
  }

  const comments = await getCommentsByWorkId(result.rows[0].work_id);

  return comments.find((comment) => String(comment.id) === String(commentId));
}

/**
 * Видаляє власний коментар користувача.
 *
 * @param {number|string} commentId - ID коментаря.
 * @param {string} userId - ID користувача.
 * @returns {Promise<boolean>} true, якщо коментар видалено.
 */
async function deleteOwnComment(commentId, userId) {
  const result = await query(
    `
      DELETE FROM comments
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `,
    [commentId, userId],
  );

  return result.rows.length > 0;
}

/**
 * Додає або прибирає лайк з коментаря.
 *
 * @param {number|string} commentId - ID коментаря.
 * @param {string} userId - ID користувача.
 * @returns {Promise<Object|null>} Оновлений коментар або null.
 */
async function toggleCommentLike(commentId, userId) {
  const existingComment = await query(
    `
      SELECT id, work_id
      FROM comments
      WHERE id = $1
    `,
    [commentId],
  );

  if (existingComment.rows.length === 0) {
    return null;
  }

  const existingLike = await query(
    `
      SELECT id
      FROM comment_likes
      WHERE comment_id = $1 AND user_id = $2
    `,
    [commentId, userId],
  );

  if (existingLike.rows.length > 0) {
    await query(
      `
        DELETE FROM comment_likes
        WHERE comment_id = $1 AND user_id = $2
      `,
      [commentId, userId],
    );
  } else {
    await query(
      `
        INSERT INTO comment_likes (comment_id, user_id)
        VALUES ($1, $2)
      `,
      [commentId, userId],
    );
  }

  const comments = await getCommentsByWorkId(existingComment.rows[0].work_id);

  return comments.find((comment) => String(comment.id) === String(commentId));
}

module.exports = {
  getCommentsByWorkId,
  getCommentsByUserId,
  createComment,
  updateOwnComment,
  deleteOwnComment,
  toggleCommentLike,
};