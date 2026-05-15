import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import worksData from "../../data/works.json";
import { logout } from "../../store/authSlice";
import {
  APPROVED_WORKS_STORAGE_KEY,
  COMMENTS_STORAGE_KEY,
  PENDING_WORKS_STORAGE_KEY,
  REJECTED_WORKS_STORAGE_KEY,
  getAllPublishedWorks,
  getUserFullName,
  getUserId,
  readFromStorage,
  writeToStorage,
} from "../../utils/worksStorage";
import "./CabinetPage.css";

const FAVORITES_STORAGE_KEY = "favoriteWorks";

/**
 * Повертає коментарі поточного користувача до творів.
 *
 * @param {Object[]} works - Список творів.
 * @param {Object.<string, Array>} commentsByWork - Коментарі, згруповані за ID твору.
 * @param {string} userId - ID поточного користувача.
 * @returns {Object[]} Список коментарів користувача.
 */
function getUserComments(works, commentsByWork, userId) {
  return works.flatMap((work) => {
    const comments = commentsByWork[String(work.id)] || [];

    return comments
      .filter((comment) => comment.userId === userId)
      .map((comment) => ({
        ...comment,
        workId: work.id,
        workTitle: work.title,
        workAuthor: work.author,
      }));
  });
}

/**
 * Сторінка особистого кабінету авторизованого користувача.
 *
 * @returns {JSX.Element} Сторінка особистого кабінету.
 */
export default function CabinetPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const favoriteIds = useMemo(() => {
    return readFromStorage(FAVORITES_STORAGE_KEY, []);
  }, []);

  const commentsByWork = useMemo(() => {
    return readFromStorage(COMMENTS_STORAGE_KEY, {});
  }, []);

  const pendingWorks = useMemo(() => {
    return readFromStorage(PENDING_WORKS_STORAGE_KEY, []);
  }, []);

  const approvedUserWorks = useMemo(() => {
    return readFromStorage(APPROVED_WORKS_STORAGE_KEY, []);
  }, []);

  const rejectedWorks = useMemo(() => {
    return readFromStorage(REJECTED_WORKS_STORAGE_KEY, []);
  }, []);

  const allPublishedWorks = useMemo(() => {
    return getAllPublishedWorks(worksData);
  }, []);

  const userId = getUserId(user);
  const userFullName = getUserFullName(user);

  const favoriteWorks = allPublishedWorks.filter((work) =>
    favoriteIds.includes(work.id),
  );

  const userWorks = [
    ...pendingWorks
      .filter((work) => work.authorId === userId)
      .map((work) => ({
        ...work,
        displayStatus: "На модерації",
        statusType: "pending",
      })),
    ...approvedUserWorks
      .filter((work) => work.authorId === userId)
      .map((work) => ({
        ...work,
        displayStatus: "Опубліковано",
        statusType: "approved",
      })),
    ...rejectedWorks
      .filter((work) => work.authorId === userId)
      .map((work) => ({
        ...work,
        displayStatus: "Відхилено",
        statusType: "rejected",
      })),
  ];

  const userComments = getUserComments(
    allPublishedWorks,
    commentsByWork,
    userId,
  );

  /**
   * Виконує вихід користувача з акаунту.
   *
   * @returns {void}
   */
  const onLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  /**
   * Видаляє власний твір користувача.
   *
   * @param {number|string} workId - ID твору.
   * @param {string} statusType - Статус твору.
   * @returns {void}
   */
  const deleteOwnWork = (workId, statusType) => {
    const shouldDelete = window.confirm(
      "Ви впевнені, що хочете видалити цей твір?",
    );

    if (!shouldDelete) {
      return;
    }

    if (statusType === "pending") {
      const updatedPendingWorks = pendingWorks.filter(
        (work) => work.id !== workId,
      );

      writeToStorage(PENDING_WORKS_STORAGE_KEY, updatedPendingWorks);
      window.location.reload();
      return;
    }

    if (statusType === "approved") {
      const updatedApprovedWorks = approvedUserWorks.filter(
        (work) => work.id !== workId,
      );

      writeToStorage(APPROVED_WORKS_STORAGE_KEY, updatedApprovedWorks);
      window.location.reload();
      return;
    }

    const updatedRejectedWorks = rejectedWorks.filter(
      (work) => work.id !== workId,
    );

    writeToStorage(REJECTED_WORKS_STORAGE_KEY, updatedRejectedWorks);
    window.location.reload();
  };

  return (
    <div className="cabinet">
      <section className="cabinet__card">
        <div className="cabinet__header">
          <div>
            <h1 className="cabinet__title">Особистий кабінет</h1>
            <p className="cabinet__subtitle">
              Тут зібрані ваші дані, власні твори, обране та залишені оцінки.
            </p>
          </div>

          <div className="cabinet__actions">
            <Link className="cabinet__add-link" to="/works/create">
              Додати твір
            </Link>

            <button className="cabinet__button" type="button" onClick={onLogout}>
              Вийти з акаунту
            </button>
          </div>
        </div>

        <div className="cabinet__profile">
          <div className="cabinet__profile-item">
            <span className="cabinet__label">Ім&apos;я та прізвище</span>
            <strong>{userFullName}</strong>
          </div>

          <div className="cabinet__profile-item">
            <span className="cabinet__label">Логін</span>
            <strong>{user.login}</strong>
          </div>

          <div className="cabinet__profile-item">
            <span className="cabinet__label">Email</span>
            <strong>{user.email}</strong>
          </div>
        </div>
      </section>

      <section className="cabinet__section">
        <div className="cabinet__section-header">
          <h2 className="cabinet__section-title">Мої твори</h2>

          <Link className="cabinet__add-link" to="/works/create">
            Додати твір
          </Link>
        </div>

        {userWorks.length === 0 ? (
          <p className="cabinet__empty">
            Ви ще не відправляли власні твори на публікацію.
          </p>
        ) : (
          <div className="cabinet__list">
            {userWorks.map((work) => (
              <article
                className="cabinet__work"
                key={`${work.statusType}-${work.id}`}
              >
                <img
                  className="cabinet__work-cover"
                  src={work.cover}
                  alt={work.title}
                />

                <div className="cabinet__work-info">
                  <div className="cabinet__work-top">
                    <div>
                      <h3 className="cabinet__work-title">{work.title}</h3>
                      <p className="cabinet__work-author">{work.author}</p>
                    </div>

                    <span
                      className={`cabinet__status cabinet__status--${work.statusType}`}
                    >
                      {work.displayStatus}
                    </span>
                  </div>

                  <p className="cabinet__work-description">
                    {work.description}
                  </p>

                  {work.statusType === "pending" && (
                    <span className="cabinet__note">
                      Твір очікує перевірки модератором.
                    </span>
                  )}

                  {work.statusType === "approved" && (
                    <span className="cabinet__note cabinet__note--approved">
                      Твір опубліковано {work.approvedAt || ""}.
                    </span>
                  )}

                  {work.statusType === "rejected" && (
                    <div className="cabinet__moderation-history">
                      <strong>Причина відхилення:</strong>
                      <p>{work.rejectionReason || "Причину не вказано."}</p>
                      <span>Дата відхилення: {work.rejectedAt || "—"}</span>
                    </div>
                  )}

                  <div className="cabinet__work-actions">
                    {work.statusType === "approved" && (
                      <Link className="cabinet__link" to={`/works/${work.id}`}>
                        Перейти до твору
                      </Link>
                    )}

                    <Link
                      className="cabinet__link cabinet__link--secondary"
                      to={`/works/edit/${work.id}`}
                    >
                      Редагувати
                    </Link>

                    <button
                      className="cabinet__delete"
                      type="button"
                      onClick={() => deleteOwnWork(work.id, work.statusType)}
                    >
                      Видалити
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="cabinet__section">
        <h2 className="cabinet__section-title">Обрані твори</h2>

        {favoriteWorks.length === 0 ? (
          <p className="cabinet__empty">Ви ще не додали твори в обране.</p>
        ) : (
          <div className="cabinet__list">
            {favoriteWorks.map((work) => (
              <article className="cabinet__work" key={work.id}>
                <img
                  className="cabinet__work-cover"
                  src={work.cover}
                  alt={work.title}
                />

                <div className="cabinet__work-info">
                  <h3 className="cabinet__work-title">{work.title}</h3>
                  <p className="cabinet__work-author">{work.author}</p>
                  <p className="cabinet__work-description">
                    {work.description}
                  </p>

                  <Link className="cabinet__link" to={`/works/${work.id}`}>
                    Перейти до твору
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="cabinet__section">
        <h2 className="cabinet__section-title">Мої коментарі та оцінки</h2>

        {userComments.length === 0 ? (
          <p className="cabinet__empty">
            Ви ще не залишали коментарів до творів.
          </p>
        ) : (
          <div className="cabinet__comments">
            {userComments.map((comment) => (
              <article className="cabinet__comment" key={comment.id}>
                <div className="cabinet__comment-header">
                  <div>
                    <h3 className="cabinet__comment-title">
                      {comment.workTitle}
                    </h3>
                    <p className="cabinet__comment-author">
                      {comment.workAuthor}
                    </p>
                  </div>

                  <span className="cabinet__rating">
                    Оцінка: {comment.rating}/5
                  </span>
                </div>

                <p className="cabinet__comment-text">{comment.text}</p>
                <span className="cabinet__date">{comment.createdAt}</span>

                <Link className="cabinet__link" to={`/works/${comment.workId}`}>
                  Перейти до твору
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}