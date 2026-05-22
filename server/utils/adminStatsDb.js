const { query } = require("./db");

/**
 * Повертає числове значення з SQL count-запиту.
 *
 * @param {Object} result - Результат SQL-запиту.
 * @param {string} field - Назва поля.
 * @returns {number} Число.
 */
function getCount(result, field = "count") {
  return Number(result.rows[0]?.[field] || 0);
}

/**
 * Повертає загальну статистику системи для сторінки адміністратора.
 *
 * @returns {Promise<Object>} Статистика системи.
 */
async function getAdminStats() {
  const [
    usersResult,
    worksResult,
    pendingWorksResult,
    approvedWorksResult,
    rejectedWorksResult,
    commentsResult,
    commentLikesResult,
    favoriteWorksResult,
    readingProgressResult,
    favoriteGenresResult,
    genreStatsResult,
    authorStatsResult,
    recentWorksResult,
  ] = await Promise.all([
    query("SELECT COUNT(id) AS count FROM users"),

    query("SELECT COUNT(id) AS count FROM works"),

    query("SELECT COUNT(id) AS count FROM works WHERE status = 'pending'"),

    query("SELECT COUNT(id) AS count FROM works WHERE status = 'approved'"),

    query("SELECT COUNT(id) AS count FROM works WHERE status = 'rejected'"),

    query("SELECT COUNT(id) AS count FROM comments"),

    query("SELECT COUNT(id) AS count FROM comment_likes"),

    query("SELECT COUNT(id) AS count FROM favorite_works"),

    query("SELECT COUNT(id) AS count FROM reading_progress"),

    query("SELECT COUNT(id) AS count FROM favorite_genres"),

    query(`
      SELECT
        genre,
        COUNT(id) AS count
      FROM works
      GROUP BY genre
      ORDER BY count DESC, genre ASC
    `),

    query(`
      SELECT
        author,
        author_id,
        COUNT(id) AS works_count
      FROM works
      GROUP BY author, author_id
      ORDER BY works_count DESC, author ASC
      LIMIT 10
    `),

    query(`
      SELECT
        works.id,
        works.title,
        works.author,
        works.status,
        works.created_at,
        COALESCE(AVG(comments.rating), 0) AS rating,
        COUNT(comments.id) AS comments_count
      FROM works
      LEFT JOIN comments
        ON works.id = comments.work_id
      GROUP BY works.id
      ORDER BY works.created_at DESC, works.id DESC
      LIMIT 10
    `),
  ]);

  return {
    summary: {
      usersCount: getCount(usersResult),
      worksCount: getCount(worksResult),
      pendingWorksCount: getCount(pendingWorksResult),
      approvedWorksCount: getCount(approvedWorksResult),
      rejectedWorksCount: getCount(rejectedWorksResult),
      commentsCount: getCount(commentsResult),
      commentLikesCount: getCount(commentLikesResult),
      favoriteWorksCount: getCount(favoriteWorksResult),
      readingProgressCount: getCount(readingProgressResult),
      favoriteGenresCount: getCount(favoriteGenresResult),
    },

    genres: genreStatsResult.rows.map((row) => ({
      genre: row.genre || "Без жанру",
      count: Number(row.count || 0),
    })),

    authors: authorStatsResult.rows.map((row) => ({
      author: row.author || "Невідомий автор",
      authorId: row.author_id ? String(row.author_id) : null,
      worksCount: Number(row.works_count || 0),
    })),

    recentWorks: recentWorksResult.rows.map((row) => ({
      id: String(row.id),
      title: row.title,
      author: row.author,
      status: row.status,
      rating: Number(row.rating || 0),
      commentsCount: Number(row.comments_count || 0),
      createdAt: row.created_at,
    })),
  };
}

module.exports = {
  getAdminStats,
};