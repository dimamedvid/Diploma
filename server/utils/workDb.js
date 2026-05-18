const { query } = require("./db");

/**
 * Перетворює запис твору з PostgreSQL у формат для frontend.
 *
 * @param {Object} row - Запис твору з бази даних.
 * @returns {Object} Твір у camelCase форматі.
 */
function mapWorkRow(row) {
  return {
    id: String(row.id),
    title: row.title,
    author: row.author,
    authorId: row.author_id,
    genre: row.genre,
    rating: Number(row.rating || 0),
    description: row.description,
    cover: row.cover,
    status: row.status,
    submittedAt: row.submitted_at,
    approvedAt: row.approved_at,
    rejectedAt: row.rejected_at,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Перетворює записи сторінок з PostgreSQL у масив текстових сторінок.
 *
 * @param {Object[]} rows - Записи сторінок з бази даних.
 * @returns {string[]} Масив сторінок твору.
 */
function mapPageRows(rows) {
  return rows.map((row) => row.content);
}

/**
 * Повертає список опублікованих творів.
 *
 * Для каталогу повертається тільки загальна інформація без повного тексту сторінок.
 *
 * @returns {Promise<Object[]>} Список опублікованих творів.
 */
async function getPublishedWorks() {
  const result = await query(
    `
      SELECT
        id,
        title,
        author,
        author_id,
        genre,
        description,
        cover,
        status,
        rating,
        submitted_at,
        approved_at,
        rejected_at,
        rejection_reason,
        created_at,
        updated_at
      FROM works
      WHERE status = $1
      ORDER BY created_at DESC, id DESC
    `,
    ["approved"],
  );

  return result.rows.map(mapWorkRow);
}

/**
 * Повертає один твір разом зі сторінками.
 *
 * @param {number|string} workId - ID твору.
 * @returns {Promise<Object|null>} Твір зі сторінками або null.
 */
async function getWorkById(workId) {
  const workResult = await query(
    `
      SELECT
        id,
        title,
        author,
        author_id,
        genre,
        description,
        cover,
        status,
        rating,
        submitted_at,
        approved_at,
        rejected_at,
        rejection_reason,
        created_at,
        updated_at
      FROM works
      WHERE id = $1
    `,
    [workId],
  );

  if (workResult.rows.length === 0) {
    return null;
  }

  const pagesResult = await query(
    `
      SELECT page_number, content
      FROM work_pages
      WHERE work_id = $1
      ORDER BY page_number ASC
    `,
    [workId],
  );

  return {
    ...mapWorkRow(workResult.rows[0]),
    pages: mapPageRows(pagesResult.rows),
  };
}

/**
 * Створює новий твір і його сторінки у PostgreSQL.
 *
 * Новий твір одразу отримує статус pending,
 * тобто очікує перевірки модератором.
 *
 * @param {Object} workData - Дані нового твору.
 * @param {string} workData.title - Назва твору.
 * @param {string} workData.author - Автор твору.
 * @param {string} workData.authorId - ID автора.
 * @param {string} workData.genre - Жанр твору.
 * @param {string} workData.description - Опис твору.
 * @param {string} workData.cover - Посилання на обкладинку.
 * @param {string[]} workData.pages - Сторінки твору.
 * @returns {Promise<Object>} Створений твір зі сторінками.
 */
async function createWork(workData) {
  const {
    title,
    author,
    authorId,
    genre,
    description,
    cover,
    pages,
  } = workData;

  const createdWorkResult = await query(
    `
      INSERT INTO works (
        title,
        author,
        author_id,
        genre,
        description,
        cover,
        status,
        rating,
        submitted_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      RETURNING
        id,
        title,
        author,
        author_id,
        genre,
        description,
        cover,
        status,
        rating,
        submitted_at,
        approved_at,
        rejected_at,
        rejection_reason,
        created_at,
        updated_at
    `,
    [
      title,
      author,
      authorId,
      genre,
      description,
      cover,
      "pending",
      0,
    ],
  );

  const createdWork = mapWorkRow(createdWorkResult.rows[0]);

  await Promise.all(
    pages.map((pageContent, index) =>
      query(
        `
          INSERT INTO work_pages (work_id, page_number, content)
          VALUES ($1, $2, $3)
        `,
        [createdWork.id, index + 1, pageContent],
      ),
    ),
  );

  return {
    ...createdWork,
    pages,
  };
}

module.exports = {
  getPublishedWorks,
  getWorkById,
  createWork,
};