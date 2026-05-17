import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import worksData from "../../data/works.json";
import { logout } from "../../store/authSlice";
import {
  APPROVED_WORKS_STORAGE_KEY,
  PENDING_WORKS_STORAGE_KEY,
  REJECTED_WORKS_STORAGE_KEY,
  getAllPublishedWorks,
  getUserFullName,
  getUserId,
  readFromStorage,
  writeToStorage,
} from "../../utils/worksStorage";
import {
  deleteOwnCommentFromWork,
  editOwnComment,
  getAllCommentsByWork,
  getUserComments,
  saveAllCommentsByWork,
} from "../../utils/commentsStorage";
import {
  deleteReadingProgressByWork,
  getAllReadingProgress,
  getContinueReadingWorks,
  saveAllReadingProgress,
} from "../../utils/readingProgressStorage";
import {
  getFavoriteWorkIds,
  getFavoriteWorks,
} from "../../utils/favoritesStorage";
import { STORAGE_KEYS } from "../../utils/storageKeys";
import "./CabinetPage.css";

const FAVORITE_GENRES_STORAGE_KEY = STORAGE_KEYS.FAVORITE_GENRES;
const MAX_FAVORITE_GENRES = 3;

/**
 * Повертає список усіх жанрів з опублікованих творів.
 *
 * @param {Object[]} works - Список творів.
 * @returns {string[]} Список унікальних жанрів.
 */
function getAvailableGenres(works) {
  return [...new Set(works.map((work) => work.genre))];
}

/**
 * Повертає улюблені жанри конкретного користувача.
 *
 * @param {Object.<string, string[]>} favoriteGenresByUser - Дані жанрів.
 * @param {string} userId - ID користувача.
 * @returns {string[]} Улюблені жанри користувача.
 */
function getUserFavoriteGenres(favoriteGenresByUser, userId) {
  return favoriteGenresByUser[userId] || [];
}

/**
 * Сторінка особистого кабінету авторизованого користувача.
 *
 * Відображає дані користувача, прогрес читання, улюблені жанри,
 * власні твори, обране, коментарі та оцінки.
 *
 * @returns {JSX.Element} Сторінка особистого кабінету.
 */
export default function CabinetPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [worksFilter, setWorksFilter] = useState("all");

  const [favoriteGenresByUser, setFavoriteGenresByUser] = useState(() =>
    readFromStorage(FAVORITE_GENRES_STORAGE_KEY, {}),
  );

  const [readingProgressByUser, setReadingProgressByUser] = useState(() =>
    getAllReadingProgress(),
  );

  const [commentsByWork, setCommentsByWork] = useState(() =>
    getAllCommentsByWork(),
  );

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [editingCommentRating, setEditingCommentRating] = useState("5");

  const favoriteIds = useMemo(() => {
    return getFavoriteWorkIds();
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

  const availableGenres = getAvailableGenres(allPublishedWorks);

  const selectedFavoriteGenres = getUserFavoriteGenres(
    favoriteGenresByUser,
    userId,
  );

  const continueReadingWorks = getContinueReadingWorks(
    allPublishedWorks,
    readingProgressByUser,
    userId,
  );

  const favoriteWorks = getFavoriteWorks(allPublishedWorks, favoriteIds);

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

  const filteredUserWorks = userWorks.filter((work) => {
    if (worksFilter === "all") {
      return true;
    }

    return work.statusType === worksFilter;
  });

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
   * Зберігає оновлений об'єкт коментарів.
   *
   * @param {Object.<string, Array>} updatedCommentsByWork - Оновлені коментарі.
   * @returns {void}
   */
  const saveComments = (updatedCommentsByWork) => {
    setCommentsByWork(updatedCommentsByWork);
    saveAllCommentsByWork(updatedCommentsByWork);
  };

  /**
   * Додає або прибирає жанр зі списку улюблених жанрів користувача.
   *
   * @param {string} genre - Назва жанру.
   * @returns {void}
   */
  const toggleFavoriteGenre = (genre) => {
    const isSelected = selectedFavoriteGenres.includes(genre);

    if (!isSelected && selectedFavoriteGenres.length >= MAX_FAVORITE_GENRES) {
      return;
    }

    const updatedGenres = isSelected
      ? selectedFavoriteGenres.filter((selectedGenre) => selectedGenre !== genre)
      : [...selectedFavoriteGenres, genre];

    const updatedFavoriteGenresByUser = {
      ...favoriteGenresByUser,
      [userId]: updatedGenres,
    };

    setFavoriteGenresByUser(updatedFavoriteGenresByUser);
    writeToStorage(FAVORITE_GENRES_STORAGE_KEY, updatedFavoriteGenresByUser);
  };

  /**
   * Видаляє твір зі списку "Продовжити читання".
   *
   * Сам твір не видаляється, очищується тільки прогрес читання користувача.
   *
   * @param {number|string} workId - ID твору.
   * @returns {void}
   */
  const deleteReadingProgress = (workId) => {
    const updatedReadingProgressByUser = deleteReadingProgressByWork(
      readingProgressByUser,
      userId,
      workId,
    );

    setReadingProgressByUser(updatedReadingProgressByUser);
    saveAllReadingProgress(updatedReadingProgressByUser);
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

  /**
   * Вмикає режим редагування коментаря користувача.
   *
   * @param {Object} comment - Коментар користувача.
   * @returns {void}
   */
  const startEditingComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.text);
    setEditingCommentRating(String(comment.rating));
  };

  /**
   * Скасовує редагування коментаря.
   *
   * @returns {void}
   */
  const cancelEditingComment = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
    setEditingCommentRating("5");
  };

  /**
   * Зберігає зміни коментаря з кабінету користувача.
   *
   * @param {React.FormEvent<HTMLFormElement>} event - Подія submit.
   * @param {number|string} workId - ID твору.
   * @param {number|string} commentId - ID коментаря.
   * @returns {void}
   */
  const saveEditedComment = (event, workId, commentId) => {
    event.preventDefault();

    const normalizedText = editingCommentText.trim();

    if (!normalizedText) {
      return;
    }

    const updatedCommentsByWork = editOwnComment(
      commentsByWork,
      workId,
      commentId,
      userId,
      normalizedText,
      editingCommentRating,
    );

    saveComments(updatedCommentsByWork);
    cancelEditingComment();
  };

  /**
   * Видаляє коментар користувача.
   *
   * @param {number|string} workId - ID твору.
   * @param {number|string} commentId - ID коментаря.
   * @returns {void}
   */
  const deleteOwnComment = (workId, commentId) => {
    const shouldDelete = window.confirm(
      "Ви впевнені, що хочете видалити цей коментар?",
    );

    if (!shouldDelete) {
      return;
    }

    const updatedCommentsByWork = deleteOwnCommentFromWork(
      commentsByWork,
      workId,
      commentId,
      userId,
    );

    saveComments(updatedCommentsByWork);

    if (editingCommentId === commentId) {
      cancelEditingComment();
    }
  };

  return (
    <div className="cabinet">
      <section className="cabinet__card">
        <div className="cabinet__header">
          <div>
            <h1 className="cabinet__title">Особистий кабінет</h1>
            <p className="cabinet__subtitle">
              Тут зібрані ваші дані, прогрес читання, власні твори, обране та
              залишені оцінки.
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

        <div className="cabinet__genres">
          <div className="cabinet__genres-header">
            <h2 className="cabinet__genres-title">Улюблені жанри</h2>

            <span className="cabinet__genres-counter">
              Обрано {selectedFavoriteGenres.length} з {MAX_FAVORITE_GENRES}
            </span>
          </div>

          <p className="cabinet__genres-text">
            Оберіть до трьох жанрів. На головній сторінці твори цих жанрів
            будуть показуватись першими.
          </p>

          <div className="cabinet__genres-list">
            {availableGenres.map((genreName) => {
              const isSelected = selectedFavoriteGenres.includes(genreName);
              const isDisabled =
                !isSelected &&
                selectedFavoriteGenres.length >= MAX_FAVORITE_GENRES;

              return (
                <button
                  className={`cabinet__genre-button ${
                    isSelected ? "cabinet__genre-button--active" : ""
                  }`}
                  type="button"
                  key={genreName}
                  onClick={() => toggleFavoriteGenre(genreName)}
                  disabled={isDisabled}
                >
                  {genreName}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="cabinet__section">
        <h2 className="cabinet__section-title">Продовжити читання</h2>

        {continueReadingWorks.length === 0 ? (
          <p className="cabinet__empty">Ви ще не починали читати твори.</p>
        ) : (
          <div className="cabinet__list">
            {continueReadingWorks.map((work) => (
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
                    Ви зупинилися на сторінці {work.currentPage + 1} з{" "}
                    {work.pagesCount}.
                  </p>

                  <div className="cabinet__work-actions">
                    <Link className="cabinet__link" to={`/works/${work.id}`}>
                      Продовжити читання
                    </Link>

                    <button
                      className="cabinet__delete"
                      type="button"
                      onClick={() => deleteReadingProgress(work.id)}
                    >
                      Прибрати
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="cabinet__section">
        <div className="cabinet__section-header">
          <h2 className="cabinet__section-title">Мої твори</h2>

          <Link className="cabinet__add-link" to="/works/create">
            Додати твір
          </Link>
        </div>

        <div className="cabinet__filters">
          <button
            className={`cabinet__filter-button ${
              worksFilter === "all" ? "cabinet__filter-button--active" : ""
            }`}
            type="button"
            onClick={() => setWorksFilter("all")}
          >
            Усі
          </button>

          <button
            className={`cabinet__filter-button ${
              worksFilter === "pending" ? "cabinet__filter-button--active" : ""
            }`}
            type="button"
            onClick={() => setWorksFilter("pending")}
          >
            На модерації
          </button>

          <button
            className={`cabinet__filter-button ${
              worksFilter === "approved" ? "cabinet__filter-button--active" : ""
            }`}
            type="button"
            onClick={() => setWorksFilter("approved")}
          >
            Опубліковані
          </button>

          <button
            className={`cabinet__filter-button ${
              worksFilter === "rejected" ? "cabinet__filter-button--active" : ""
            }`}
            type="button"
            onClick={() => setWorksFilter("rejected")}
          >
            Відхилені
          </button>
        </div>

        {filteredUserWorks.length === 0 ? (
          <p className="cabinet__empty">
            Немає творів для вибраного фільтра.
          </p>
        ) : (
          <div className="cabinet__list">
            {filteredUserWorks.map((work) => (
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
            {userComments.map((comment) => {
              const isEditing = editingCommentId === comment.id;

              return (
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

                  {isEditing ? (
                    <form
                      className="cabinet__comment-edit-form"
                      onSubmit={(event) =>
                        saveEditedComment(event, comment.workId, comment.id)
                      }
                    >
                      <label className="cabinet__comment-edit-label">
                        Оцінка
                        <select
                          className="cabinet__comment-select"
                          value={editingCommentRating}
                          onChange={(event) =>
                            setEditingCommentRating(event.target.value)
                          }
                        >
                          <option value="5">5</option>
                          <option value="4">4</option>
                          <option value="3">3</option>
                          <option value="2">2</option>
                          <option value="1">1</option>
                        </select>
                      </label>

                      <label className="cabinet__comment-edit-label">
                        Коментар
                        <textarea
                          className="cabinet__comment-textarea"
                          value={editingCommentText}
                          onChange={(event) =>
                            setEditingCommentText(event.target.value)
                          }
                          rows="4"
                        />
                      </label>

                      <div className="cabinet__comment-edit-actions">
                        <button className="cabinet__comment-save" type="submit">
                          Зберегти
                        </button>

                        <button
                          className="cabinet__delete"
                          type="button"
                          onClick={cancelEditingComment}
                        >
                          Скасувати
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <p className="cabinet__comment-text">{comment.text}</p>

                      <div className="cabinet__comment-meta">
                        <span className="cabinet__date">
                          {comment.createdAt}
                        </span>

                        {comment.updatedAt && (
                          <span className="cabinet__date">
                            Змінено: {comment.updatedAt}
                          </span>
                        )}
                      </div>

                      <div className="cabinet__comment-actions">
                        <Link
                          className="cabinet__link"
                          to={`/works/${comment.workId}`}
                        >
                          Перейти до твору
                        </Link>

                        <button
                          className="cabinet__comment-button"
                          type="button"
                          onClick={() => startEditingComment(comment)}
                        >
                          Редагувати
                        </button>

                        <button
                          className="cabinet__delete"
                          type="button"
                          onClick={() =>
                            deleteOwnComment(comment.workId, comment.id)
                          }
                        >
                          Видалити
                        </button>
                      </div>
                    </>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}