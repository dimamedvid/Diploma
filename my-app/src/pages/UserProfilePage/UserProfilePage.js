import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import WorksGrid from "../../components/WorksGrid/WorksGrid";
import { getUserProfile } from "../../api/usersApi";
import "./UserProfilePage.css";

/**
 * Форматує дату у формат uk-UA.
 *
 * @param {string} value - Дата.
 * @returns {string} Відформатована дата.
 */
function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString("uk-UA");
}

/**
 * Публічна сторінка користувача.
 *
 * @returns {JSX.Element} Сторінка профілю користувача.
 */
export default function UserProfilePage() {
  const { id } = useParams();

  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    /**
     * Завантажує профіль користувача.
     *
     * @returns {Promise<void>}
     */
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        setError("");

        const profileFromApi = await getUserProfile(id);

        if (!isMounted) {
          return;
        }

        setProfile(profileFromApi);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(
          loadError.message ||
            "Не вдалося завантажити профіль користувача.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const user = profile?.user;
  const stats = profile?.stats || {};
  const works = useMemo(() => profile?.works || [], [profile]);

  if (isLoading) {
    return (
      <section className="user-profile">
        <div className="user-profile__card">
          <p className="user-profile__empty">Завантажуємо профіль...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="user-profile">
        <div className="user-profile__card">
          <h1 className="user-profile__title">Профіль користувача</h1>
          <p className="user-profile__empty">{error}</p>

          <Link className="user-profile__link" to="/">
            Повернутися на головну
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="user-profile">
      <div className="user-profile__card">
        <div className="user-profile__header">
          <div>
            <p className="user-profile__eyebrow">Профіль користувача</p>

            <h1 className="user-profile__title">
              {user.fullName || user.login}
            </h1>

            <p className="user-profile__subtitle">@{user.login}</p>
          </div>

          <span className="user-profile__role">{user.role}</span>
        </div>

        <div className="user-profile__meta">
          <span>На сайті з: {formatDate(user.createdAt)}</span>
        </div>

        <div className="user-profile__stats">
          <article className="user-profile__stat">
            <span>Опублікованих творів</span>
            <strong>{stats.worksCount || 0}</strong>
          </article>

          <article className="user-profile__stat">
            <span>Коментарів</span>
            <strong>{stats.commentsCount || 0}</strong>
          </article>

          <article className="user-profile__stat">
            <span>Додавань в обране</span>
            <strong>{stats.favoriteWorksCount || 0}</strong>
          </article>
        </div>
      </div>

      <div className="user-profile__section">
        <div className="user-profile__section-header">
          <div className="cabinet__section-header">
            <h2 className="user-profile__section-title">Опубліковані твори</h2>
          </div>
          <span className="user-profile__count">Знайдено: {works.length}</span>
        </div>

        {works.length === 0 ? (
          <p className="user-profile__empty">
            У цього користувача ще немає опублікованих творів.
          </p>
        ) : (
          <WorksGrid works={works} />
        )}
      </div>
    </section>
  );
}