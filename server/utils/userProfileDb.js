const { query } = require("./db");

/**
 * Перетворює рядок користувача у публічний формат профілю.
 *
 * @param {Object} row - Рядок користувача з PostgreSQL.
 * @returns {Object} Публічний профіль користувача.
 */
function mapPublicUserRow(row) {
  const firstName = row.first_name || "";
  const lastName = row.last_name || "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  return {
    id: String(row.id),
    login: row.login,
    firstName,
    lastName,
    fullName: fullName || row.login,
    role: row.role || "user",
    createdAt: row.created_at,
  };
}

/**
 * Перетворює рядок твору у формат для frontend.
 *
 * @param {Object} row - Рядок твору з PostgreSQL.
 * @returns {Object} Твір.
 */
function mapProfileWorkRow(row) {
  return {
    id: String(row.id),
    title: row.title,
    author: row.author,
    authorId: row.author_id ? String(row.author_id) : null,
    genre: row.genre,
    description: row.description,
    cover: row.cover,
    status: row.status,
    rating: Number(row.rating || 0),
    ratingsCount: Number(row.ratings_count || 0),
    submittedAt: row.submitted_at,
    approvedAt: row.approved_at,
    rejectedAt: row.rejected_at,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Повертає публічний профіль користувача з його опублікованими творами.
 *
 * @param {number|string} userId - ID користувача.
 * @returns {Promise<Object|null>} Профіль користувача або null.
 */
async function getUserProfileById(userId) {
  const userResult = await query(
    `
      SELECT
        id,
        login,
        first_name,
        last_name,
        role,
        created_at
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [userId],
  );

  if (userResult.rows.length === 0) {
    return null;
  }

  const worksResult = await query(
    `
      SELECT
        works.id,
        works.title,
        works.author,
        works.author_id,
        works.genre,
        works.description,
        works.cover,
        works.status,
        COALESCE(rating_stats.rating, 0) AS rating,
        COALESCE(rating_stats.ratings_count, 0) AS ratings_count,
        works.submitted_at,
        works.approved_at,
        works.rejected_at,
        works.rejection_reason,
        works.created_at,
        works.updated_at
      FROM works
      LEFT JOIN (
        SELECT
          work_id,
          AVG(rating) AS rating,
          COUNT(id) AS ratings_count
        FROM comments
        GROUP BY work_id
      ) AS rating_stats
        ON works.id = rating_stats.work_id
      WHERE works.author_id = $1
        AND works.status = 'approved'
      ORDER BY works.approved_at DESC NULLS LAST, works.created_at DESC, works.id DESC
    `,
    [userId],
  );

  const commentsCountResult = await query(
    `
      SELECT COUNT(id) AS count
      FROM comments
      WHERE user_id = $1
    `,
    [userId],
  );

  const favoriteWorksCountResult = await query(
    `
      SELECT COUNT(id) AS count
      FROM favorite_works
      WHERE user_id = $1
    `,
    [userId],
  );

  return {
    user: mapPublicUserRow(userResult.rows[0]),
    works: worksResult.rows.map(mapProfileWorkRow),
    stats: {
      worksCount: worksResult.rows.length,
      commentsCount: Number(commentsCountResult.rows[0]?.count || 0),
      favoriteWorksCount: Number(favoriteWorksCountResult.rows[0]?.count || 0),
    },
  };
}

module.exports = {
  getUserProfileById,
};