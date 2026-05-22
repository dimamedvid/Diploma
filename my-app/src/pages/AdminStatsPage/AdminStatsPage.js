import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getAdminStats } from "../../api/adminApi";
import "./AdminStatsPage.css";

/**
 * Форматує рейтинг для відображення.
 *
 * @param {number} rating - Рейтинг.
 * @returns {string} Рейтинг у текстовому форматі.
 */
function formatRating(rating) {
  const numberRating = Number(rating || 0);

  if (numberRating <= 0) {
    return "—";
  }

  return numberRating.toFixed(1);
}

/**
 * Повертає підпис статусу твору.
 *
 * @param {string} status - Статус твору.
 * @returns {string} Підпис статусу.
 */
function getStatusLabel(status) {
  const statusMap = {
    pending: "На модерації",
    approved: "Опубліковано",
    rejected: "Відхилено",
  };

  return statusMap[status] || "Невідомо";
}

/**
 * Сторінка статистики адміністратора.
 *
 * Дані завантажуються з PostgreSQL через backend API.
 *
 * @returns {JSX.Element} Сторінка статистики.
 */
export default function AdminStatsPage() {
  const { token } = useSelector((state) => state.auth);

  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    /**
     * Завантажує статистику з backend.
     *
     * @returns {Promise<void>}
     */
    const loadStats = async () => {
      if (!token) {
        setIsLoading(false);
        setError("Щоб переглянути статистику, потрібно увійти.");
        return;
      }

      try {
        setIsLoading(true);
        setError("");

        const statsFromApi = await getAdminStats(token);

        if (!isMounted) {
          return;
        }

        setStats(statsFromApi);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(
          loadError.message ||
            "Не вдалося завантажити статистику. Перевірте backend.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadStats();

    return () => {
      isMounted = false;
    };
  }, [token]);

  if (isLoading) {
    return (
      <section className="admin-stats">
        <div className="admin-stats__card">
          <h1 className="admin-stats__title">Статистика</h1>
          <p className="admin-stats__empty">Завантажуємо статистику...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="admin-stats">
        <div className="admin-stats__card">
          <h1 className="admin-stats__title">Статистика</h1>
          <p className="admin-stats__empty">{error}</p>
        </div>
      </section>
    );
  }

  const summary = stats?.summary || {};

  const metrics = [
    {
      label: "Користувачів",
      value: summary.usersCount || 0,
    },
    {
      label: "Усього творів",
      value: summary.worksCount || 0,
    },
    {
      label: "На модерації",
      value: summary.pendingWorksCount || 0,
    },
    {
      label: "Опубліковано",
      value: summary.approvedWorksCount || 0,
    },
    {
      label: "Відхилено",
      value: summary.rejectedWorksCount || 0,
    },
    {
      label: "Коментарів",
      value: summary.commentsCount || 0,
    },
    {
      label: "Лайків коментарів",
      value: summary.commentLikesCount || 0,
    },
    {
      label: "Додавань в обране",
      value: summary.favoriteWorksCount || 0,
    },
    {
      label: "Записів прогресу",
      value: summary.readingProgressCount || 0,
    },
    {
      label: "Улюблених жанрів",
      value: summary.favoriteGenresCount || 0,
    },
  ];

  return (
    <section className="admin-stats">
      <div className="admin-stats__card">
        <h1 className="admin-stats__title">Статистика</h1>

        <p className="admin-stats__subtitle">
          Дані рахуються з PostgreSQL: користувачі, твори, модерація,
          коментарі, лайки, обране, прогрес читання та улюблені жанри.
        </p>
      </div>

      <div className="admin-stats__grid">
        {metrics.map((metric) => (
          <article className="admin-stats__metric" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </div>

      <div className="admin-stats__columns">
        <section className="admin-stats__section">
          <h2 className="admin-stats__section-title">Статистика за жанрами</h2>

          {!stats.genres || stats.genres.length === 0 ? (
            <p className="admin-stats__empty">Жанрів поки немає.</p>
          ) : (
            <div className="admin-stats__list">
              {stats.genres.map((genre) => (
                <div className="admin-stats__row" key={genre.genre}>
                  <span>{genre.genre}</span>
                  <strong>{genre.count}</strong>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="admin-stats__section">
          <h2 className="admin-stats__section-title">
            Автори за кількістю творів
          </h2>

          {!stats.authors || stats.authors.length === 0 ? (
            <p className="admin-stats__empty">Авторів поки немає.</p>
          ) : (
            <div className="admin-stats__list">
              {stats.authors.map((author) => (
                <div
                  className="admin-stats__row"
                  key={`${author.authorId || "unknown"}-${author.author}`}
                >
                  <span>{author.author}</span>
                  <strong>{author.worksCount}</strong>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="admin-stats__section">
        <h2 className="admin-stats__section-title">Останні твори</h2>

        {!stats.recentWorks || stats.recentWorks.length === 0 ? (
          <p className="admin-stats__empty">Творів поки немає.</p>
        ) : (
          <div className="admin-stats__table">
            {stats.recentWorks.map((work) => (
              <article className="admin-stats__table-row" key={work.id}>
                <div>
                  <strong>{work.title}</strong>
                  <span>{work.author}</span>
                </div>

                <span>{getStatusLabel(work.status)}</span>

                <span>Рейтинг: {formatRating(work.rating)}</span>

                <span>Коментарів: {work.commentsCount}</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}