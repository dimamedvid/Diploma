const { query, transaction } = require("./db");

/**
 * Повертає ID обраних творів користувача.
 *
 * @param {string} userId - ID користувача.
 * @returns {Promise<string[]>} Масив ID творів.
 */
async function getFavoriteWorkIds(userId) {
  const result = await query(
    `
      SELECT work_id
      FROM favorite_works
      WHERE user_id = $1
      ORDER BY created_at DESC
    `,
    [userId],
  );

  return result.rows.map((row) => String(row.work_id));
}

/**
 * Додає або прибирає твір з обраного.
 *
 * @param {string} userId - ID користувача.
 * @param {number|string} workId - ID твору.
 * @returns {Promise<{ workId: string, isFavorite: boolean }>} Стан обраного.
 */
async function toggleFavoriteWork(userId, workId) {
  const existingFavorite = await query(
    `
      SELECT id
      FROM favorite_works
      WHERE user_id = $1 AND work_id = $2
    `,
    [userId, workId],
  );

  if (existingFavorite.rows.length > 0) {
    await query(
      `
        DELETE FROM favorite_works
        WHERE user_id = $1 AND work_id = $2
      `,
      [userId, workId],
    );

    return {
      workId: String(workId),
      isFavorite: false,
    };
  }

  await query(
    `
      INSERT INTO favorite_works (user_id, work_id)
      VALUES ($1, $2)
    `,
    [userId, workId],
  );

  return {
    workId: String(workId),
    isFavorite: true,
  };
}

/**
 * Повертає прогрес читання користувача.
 *
 * @param {string} userId - ID користувача.
 * @returns {Promise<Object[]>} Список прогресу читання.
 */
async function getReadingProgress(userId) {
  const result = await query(
    `
      SELECT
        reading_progress.work_id,
        reading_progress.current_page,
        reading_progress.updated_at,
        works.title,
        works.author,
        works.genre,
        works.description,
        works.cover,
        COALESCE(pages_count.pages_count, 0) AS pages_count
      FROM reading_progress
      INNER JOIN works
        ON reading_progress.work_id = works.id
      LEFT JOIN (
        SELECT work_id, COUNT(id) AS pages_count
        FROM work_pages
        GROUP BY work_id
      ) AS pages_count
        ON works.id = pages_count.work_id
      WHERE reading_progress.user_id = $1
        AND works.status = 'approved'
      ORDER BY reading_progress.updated_at DESC
    `,
    [userId],
  );

  return result.rows.map((row) => ({
    workId: String(row.work_id),
    id: String(row.work_id),
    title: row.title,
    author: row.author,
    genre: row.genre,
    description: row.description,
    cover: row.cover,
    currentPage: Number(row.current_page || 0),
    pagesCount: Number(row.pages_count || 0),
    updatedAt: row.updated_at,
  }));
}

/**
 * Зберігає сторінку, на якій користувач зупинився.
 *
 * @param {string} userId - ID користувача.
 * @param {number|string} workId - ID твору.
 * @param {number} currentPage - Поточна сторінка.
 * @returns {Promise<Object>} Оновлений прогрес.
 */
async function saveReadingProgress(userId, workId, currentPage) {
  const safeCurrentPage = Math.max(Number(currentPage) || 0, 0);

  const result = await query(
    `
      INSERT INTO reading_progress (
        user_id,
        work_id,
        current_page,
        updated_at
      )
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, work_id)
      DO UPDATE SET
        current_page = EXCLUDED.current_page,
        updated_at = CURRENT_TIMESTAMP
      RETURNING work_id, current_page, updated_at
    `,
    [userId, workId, safeCurrentPage],
  );

  return {
    workId: String(result.rows[0].work_id),
    currentPage: Number(result.rows[0].current_page),
    updatedAt: result.rows[0].updated_at,
  };
}

/**
 * Видаляє прогрес читання для конкретного твору.
 *
 * @param {string} userId - ID користувача.
 * @param {number|string} workId - ID твору.
 * @returns {Promise<boolean>} true, якщо прогрес видалено.
 */
async function deleteReadingProgress(userId, workId) {
  const result = await query(
    `
      DELETE FROM reading_progress
      WHERE user_id = $1 AND work_id = $2
      RETURNING id
    `,
    [userId, workId],
  );

  return result.rows.length > 0;
}

/**
 * Повертає улюблені жанри користувача.
 *
 * @param {string} userId - ID користувача.
 * @returns {Promise<string[]>} Масив жанрів.
 */
async function getFavoriteGenres(userId) {
  const result = await query(
    `
      SELECT genre
      FROM favorite_genres
      WHERE user_id = $1
      ORDER BY created_at ASC
    `,
    [userId],
  );

  return result.rows.map((row) => row.genre);
}

/**
 * Повністю замінює список улюблених жанрів користувача.
 *
 * @param {string} userId - ID користувача.
 * @param {string[]} genres - Новий список жанрів.
 * @returns {Promise<string[]>} Збережені жанри.
 */
async function saveFavoriteGenres(userId, genres) {
  const normalizedGenres = [...new Set(
    genres
      .filter((genre) => typeof genre === "string")
      .map((genre) => genre.trim())
      .filter(Boolean),
  )].slice(0, 3);

  return transaction(async (client) => {
    await client.query(
      `
        DELETE FROM favorite_genres
        WHERE user_id = $1
      `,
      [userId],
    );

    await Promise.all(
      normalizedGenres.map((genre) =>
        client.query(
          `
            INSERT INTO favorite_genres (user_id, genre)
            VALUES ($1, $2)
          `,
          [userId, genre],
        ),
      ),
    );

    return normalizedGenres;
  });
}

module.exports = {
  getFavoriteWorkIds,
  toggleFavoriteWork,
  getReadingProgress,
  saveReadingProgress,
  deleteReadingProgress,
  getFavoriteGenres,
  saveFavoriteGenres,
};