const { query, transaction } = require("./db");

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
 * Повертає список творів на модерації разом зі сторінками.
 *
 * @returns {Promise<Object[]>} Список творів зі статусом pending.
 */
async function getPendingWorksForModeration() {
  const worksResult = await query(
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
      ORDER BY submitted_at ASC, id ASC
    `,
    ["pending"],
  );

  const works = await Promise.all(
    worksResult.rows.map(async (workRow) => {
      const pagesResult = await query(
        `
          SELECT page_number, content
          FROM work_pages
          WHERE work_id = $1
          ORDER BY page_number ASC
        `,
        [workRow.id],
      );

      return {
        ...mapWorkRow(workRow),
        pages: mapPageRows(pagesResult.rows),
      };
    }),
  );

  return works;
}

/**
 * Повертає всі твори конкретного користувача.
 *
 * @param {string} authorId - ID автора з JWT.
 * @returns {Promise<Object[]>} Список творів користувача.
 */
async function getWorksByAuthorId(authorId) {
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
      WHERE author_id = $1
      ORDER BY created_at DESC, id DESC
    `,
    [authorId],
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
 * @param {Object} workData - Дані нового твору.
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

  return transaction(async (client) => {
    const createdWorkResult = await client.query(
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
        client.query(
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
  });
}

/**
 * Оновлює власний твір користувача.
 *
 * Після редагування твір знову переходить у статус pending.
 *
 * @param {number|string} workId - ID твору.
 * @param {string} authorId - ID автора.
 * @param {Object} workData - Нові дані твору.
 * @returns {Promise<Object|null>} Оновлений твір або null.
 */
async function updateOwnWorkById(workId, authorId, workData) {
  const {
    title,
    genre,
    description,
    cover,
    pages,
  } = workData;

  return transaction(async (client) => {
    const updatedWorkResult = await client.query(
      `
        UPDATE works
        SET
          title = $1,
          genre = $2,
          description = $3,
          cover = $4,
          status = $5,
          submitted_at = CURRENT_TIMESTAMP,
          approved_at = NULL,
          rejected_at = NULL,
          rejection_reason = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $6 AND author_id = $7
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
        genre,
        description,
        cover,
        "pending",
        workId,
        authorId,
      ],
    );

    if (updatedWorkResult.rows.length === 0) {
      return null;
    }

    await client.query(
      `
        DELETE FROM work_pages
        WHERE work_id = $1
      `,
      [workId],
    );

    await Promise.all(
      pages.map((pageContent, index) =>
        client.query(
          `
            INSERT INTO work_pages (work_id, page_number, content)
            VALUES ($1, $2, $3)
          `,
          [workId, index + 1, pageContent],
        ),
      ),
    );

    return {
      ...mapWorkRow(updatedWorkResult.rows[0]),
      pages,
    };
  });
}

/**
 * Видаляє власний твір користувача.
 *
 * Сторінки твору видаляються автоматично через ON DELETE CASCADE.
 *
 * @param {number|string} workId - ID твору.
 * @param {string} authorId - ID автора.
 * @returns {Promise<boolean>} true, якщо твір видалено.
 */
async function deleteOwnWorkById(workId, authorId) {
  const result = await query(
    `
      DELETE FROM works
      WHERE id = $1 AND author_id = $2
      RETURNING id
    `,
    [workId, authorId],
  );

  return result.rows.length > 0;
}

/**
 * Підтверджує твір і переводить його у статус approved.
 *
 * @param {number|string} workId - ID твору.
 * @returns {Promise<Object|null>} Оновлений твір або null.
 */
async function approveWorkById(workId) {
  const result = await query(
    `
      UPDATE works
      SET
        status = $1,
        approved_at = CURRENT_TIMESTAMP,
        rejected_at = NULL,
        rejection_reason = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND status = $3
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
    ["approved", workId, "pending"],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapWorkRow(result.rows[0]);
}

/**
 * Відхиляє твір і переводить його у статус rejected.
 *
 * @param {number|string} workId - ID твору.
 * @param {string} rejectionReason - Причина відхилення.
 * @returns {Promise<Object|null>} Оновлений твір або null.
 */
async function rejectWorkById(workId, rejectionReason) {
  const result = await query(
    `
      UPDATE works
      SET
        status = $1,
        rejected_at = CURRENT_TIMESTAMP,
        rejection_reason = $2,
        approved_at = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND status = $4
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
    ["rejected", rejectionReason, workId, "pending"],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapWorkRow(result.rows[0]);
}

module.exports = {
  getPublishedWorks,
  getPendingWorksForModeration,
  getWorksByAuthorId,
  getWorkById,
  createWork,
  updateOwnWorkById,
  deleteOwnWorkById,
  approveWorkById,
  rejectWorkById,
};