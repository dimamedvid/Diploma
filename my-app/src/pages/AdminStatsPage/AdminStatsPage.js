import { useMemo } from "react";
import worksData from "../../data/works.json";
import {
  APPROVED_WORKS_STORAGE_KEY,
  COMMENTS_STORAGE_KEY,
  PENDING_WORKS_STORAGE_KEY,
  REJECTED_WORKS_STORAGE_KEY,
  enrichWorksWithRating,
  getAllPublishedWorks,
  readFromStorage,
} from "../../utils/worksStorage";
import "./AdminStatsPage.css";

/**
 * Рахує загальну кількість коментарів.
 *
 * @param {Object.<string, Array>} commentsByWork - Коментарі, згруповані за ID твору.
 * @returns {number} Загальна кількість коментарів.
 */
function getCommentsCount(commentsByWork) {
  return Object.values(commentsByWork).reduce(
    (total, comments) => total + comments.length,
    0,
  );
}

/**
 * Рахує загальну кількість лайків коментарів.
 *
 * @param {Object.<string, Array>} commentsByWork - Коментарі, згруповані за ID твору.
 * @returns {number} Загальна кількість лайків.
 */
function getLikesCount(commentsByWork) {
  return Object.values(commentsByWork).reduce((total, comments) => {
    const workLikes = comments.reduce((sum, comment) => {
      return sum + (comment.likedBy?.length || 0);
    }, 0);

    return total + workLikes;
  }, 0);
}

/**
 * Повертає статистику за жанрами.
 *
 * @param {Object[]} works - Список творів.
 * @returns {Object[]} Статистика жанрів.
 */
function getGenreStats(works) {
  const genresMap = works.reduce((result, work) => {
    const genre = work.genre || "Без жанру";

    return {
      ...result,
      [genre]: (result[genre] || 0) + 1,
    };
  }, {});

  return Object.entries(genresMap)
    .map(([genre, count]) => ({
      genre,
      count,
    }))
    .sort((firstGenre, secondGenre) => secondGenre.count - firstGenre.count);
}

/**
 * Повертає статистику за авторами.
 *
 * @param {Object[]} works - Список користувацьких творів.
 * @returns {Object[]} Статистика авторів.
 */
function getAuthorStats(works) {
  const authorsMap = works.reduce((result, work) => {
    const author = work.author || "Невідомий автор";

    return {
      ...result,
      [author]: (result[author] || 0) + 1,
    };
  }, {});

  return Object.entries(authorsMap)
    .map(([author, count]) => ({
      author,
      count,
    }))
    .sort((firstAuthor, secondAuthor) => secondAuthor.count - firstAuthor.count);
}

/**
 * Повертає твори з найвищим рейтингом.
 *
 * @param {Object[]} works - Список творів.
 * @returns {Object[]} Топ творів за рейтингом.
 */
function getTopRatedWorks(works) {
  return [...works]
    .filter((work) => Number(work.rating) > 0)
    .sort((firstWork, secondWork) => secondWork.rating - firstWork.rating)
    .slice(0, 5);
}

/**
 * Сторінка статистики для адміністратора або модератора.
 *
 * Відображає загальну статистику контенту, модерації,
 * коментарів, лайків, жанрів, авторів і рейтингів.
 *
 * @returns {JSX.Element} Сторінка статистики.
 */
export default function AdminStatsPage() {
  const stats = useMemo(() => {
    const pendingWorks = readFromStorage(PENDING_WORKS_STORAGE_KEY, []);
    const approvedWorks = readFromStorage(APPROVED_WORKS_STORAGE_KEY, []);
    const rejectedWorks = readFromStorage(REJECTED_WORKS_STORAGE_KEY, []);
    const commentsByWork = readFromStorage(COMMENTS_STORAGE_KEY, {});

    const publishedWorks = enrichWorksWithRating(getAllPublishedWorks(worksData));
    const userSubmittedWorks = [
      ...pendingWorks,
      ...approvedWorks,
      ...rejectedWorks,
    ];

    return {
      baseWorksCount: worksData.length,
      publishedWorksCount: publishedWorks.length,
      pendingWorksCount: pendingWorks.length,
      approvedWorksCount: approvedWorks.length,
      rejectedWorksCount: rejectedWorks.length,
      userSubmittedWorksCount: userSubmittedWorks.length,
      commentsCount: getCommentsCount(commentsByWork),
      likesCount: getLikesCount(commentsByWork),
      genreStats: getGenreStats(publishedWorks),
      authorStats: getAuthorStats(userSubmittedWorks),
      topRatedWorks: getTopRatedWorks(publishedWorks),
    };
  }, []);

  return (
    <section className="admin-stats">
      <div className="admin-stats__card">
        <h1 className="admin-stats__title">Статистика системи</h1>

        <p className="admin-stats__subtitle">
          Панель показує загальну активність у каталозі, стан модерації,
          кількість коментарів, лайків, популярні жанри та найрейтинговіші твори.
        </p>
      </div>

      <div className="admin-stats__grid">
        <div className="admin-stats__metric">
          <span>Усього опублікованих творів</span>
          <strong>{stats.publishedWorksCount}</strong>
        </div>

        <div className="admin-stats__metric">
          <span>Базових творів</span>
          <strong>{stats.baseWorksCount}</strong>
        </div>

        <div className="admin-stats__metric">
          <span>Користувацьких заявок</span>
          <strong>{stats.userSubmittedWorksCount}</strong>
        </div>

        <div className="admin-stats__metric">
          <span>На модерації</span>
          <strong>{stats.pendingWorksCount}</strong>
        </div>

        <div className="admin-stats__metric">
          <span>Підтверджено</span>
          <strong>{stats.approvedWorksCount}</strong>
        </div>

        <div className="admin-stats__metric">
          <span>Відхилено</span>
          <strong>{stats.rejectedWorksCount}</strong>
        </div>

        <div className="admin-stats__metric">
          <span>Коментарів</span>
          <strong>{stats.commentsCount}</strong>
        </div>

        <div className="admin-stats__metric">
          <span>Лайків коментарів</span>
          <strong>{stats.likesCount}</strong>
        </div>
      </div>

      <div className="admin-stats__columns">
        <section className="admin-stats__section">
          <h2 className="admin-stats__section-title">Популярні жанри</h2>

          {stats.genreStats.length === 0 ? (
            <p className="admin-stats__empty">Жанрів поки немає.</p>
          ) : (
            <div className="admin-stats__list">
              {stats.genreStats.map((item) => (
                <div className="admin-stats__row" key={item.genre}>
                  <span>{item.genre}</span>
                  <strong>{item.count}</strong>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="admin-stats__section">
          <h2 className="admin-stats__section-title">Активні автори</h2>

          {stats.authorStats.length === 0 ? (
            <p className="admin-stats__empty">
              Користувацьких творів поки немає.
            </p>
          ) : (
            <div className="admin-stats__list">
              {stats.authorStats.slice(0, 5).map((item) => (
                <div className="admin-stats__row" key={item.author}>
                  <span>{item.author}</span>
                  <strong>{item.count}</strong>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="admin-stats__section">
        <h2 className="admin-stats__section-title">Твори з найвищим рейтингом</h2>

        {stats.topRatedWorks.length === 0 ? (
          <p className="admin-stats__empty">
            Рейтингових творів поки немає.
          </p>
        ) : (
          <div className="admin-stats__table">
            {stats.topRatedWorks.map((work) => (
              <div className="admin-stats__table-row" key={work.id}>
                <div>
                  <strong>{work.title}</strong>
                  <span>{work.author}</span>
                </div>

                <span>{work.genre}</span>

                <strong>
                  {Number(work.rating).toFixed(1)} / 5
                </strong>

                <span>
                  Оцінок: {work.ratingsCount || 0}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}