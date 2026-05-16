import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import worksData from "../../data/works.json";
import {
  COMMENTS_STORAGE_KEY,
  getAllPublishedWorks,
  getWorkRatingStats,
  readFromStorage,
  writeToStorage,
} from "../../utils/worksStorage";
import "./WorkDetailsPage.css";

const FAVORITES_STORAGE_KEY = "favoriteWorks";
const READING_PROGRESS_STORAGE_KEY = "readingProgressByUser";

/**
 * Розбиває текст сторінки на абзаци.
 *
 * @param {string} text - Текст сторінки твору.
 * @returns {JSX.Element[]} Масив абзаців.
 */
function renderParagraphs(text) {
  return text
    .split("\n\n")
    .filter(Boolean)
    .map((paragraph, index) => <p key={index}>{paragraph}</p>);
}

/**
 * Повертає коментарі для конкретного твору.
 *
 * @param {Object.<string, Array>} commentsByWork - Об'єкт коментарів.
 * @param {number|string} workId - ID твору.
 * @returns {Array} Масив коментарів твору.
 */
function getWorkComments(commentsByWork, workId) {
  return commentsByWork[String(workId)] || [];
}

/**
 * Повертає повне ім'я користувача.
 *
 * @param {Object|null} user - Дані користувача.
 * @returns {string} Повне ім'я або логін користувача.
 */
function getCommentAuthor(user) {
  return `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.login;
}

/**
 * Повертає стабільний ID користувача.
 *
 * @param {Object|null} user - Дані користувача.
 * @returns {string} ID користувача.
 */
function getCurrentUserId(user) {
  return String(user.id || user.login || user.email);
}

/**
 * Повертає збережений прогрес читання користувача.
 *
 * @param {string} userId - ID користувача.
 * @param {number|string} workId - ID твору.
 * @returns {number} Індекс останньої прочитаної сторінки.
 */
function getSavedReadingPage(userId, workId) {
  const progressByUser = readFromStorage(READING_PROGRESS_STORAGE_KEY, {});

  return Number(progressByUser[userId]?.[String(workId)] || 0);
}

/**
 * Зберігає прогрес читання користувача.
 *
 * @param {string} userId - ID користувача.
 * @param {number|string} workId - ID твору.
 * @param {number} pageIndex - Індекс поточної сторінки.
 * @returns {void}
 */
function saveReadingPage(userId, workId, pageIndex) {
  const progressByUser = readFromStorage(READING_PROGRESS_STORAGE_KEY, {});

  const updatedProgress = {
    ...progressByUser,
    [userId]: {
      ...(progressByUser[userId] || {}),
      [String(workId)]: pageIndex,
    },
  };

  writeToStorage(READING_PROGRESS_STORAGE_KEY, updatedProgress);
}

/**
 * Сторінка детального перегляду твору.
 *
 * Містить інформацію про твір, читання по сторінках,
 * збереження прогресу читання, обране, коментарі,
 * редагування, видалення коментарів, лайки та рейтинг.
 *
 * @function WorkDetailsPage
 * @returns {JSX.Element}
 */
export default function WorkDetailsPage() {
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);

  const [currentPage, setCurrentPage] = useState(0);

  const [favoriteIds, setFavoriteIds] = useState(() =>
    readFromStorage(FAVORITES_STORAGE_KEY, []),
  );

  const [commentsByWork, setCommentsByWork] = useState(() =>
    readFromStorage(COMMENTS_STORAGE_KEY, {}),
  );

  const [commentText, setCommentText] = useState("");
  const [commentRating, setCommentRating] = useState("5");

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [editingRating, setEditingRating] = useState("5");

  const allWorks = useMemo(() => {
    return getAllPublishedWorks(worksData);
  }, []);

  const work = useMemo(() => {
    return allWorks.find((item) => String(item.id) === String(id));
  }, [allWorks, id]);

  const isAuthorized = Boolean(user);
  const currentUserId = isAuthorized ? getCurrentUserId(user) : "";

  const pages = work?.pages || [];
  const pageText = pages[currentPage] || "Текст твору поки не додано.";
  const isFavorite = work ? favoriteIds.includes(work.id) : false;
  const workComments = work ? getWorkComments(commentsByWork, work.id) : [];
  const ratingStats = work
    ? getWorkRatingStats(work, commentsByWork)
    : {
      rating: 0,
      ratingsCount: 0,
    };

  const commentAuthor = isAuthorized ? getCommentAuthor(user) : "";

  const hasUserCommented = workComments.some(
    (comment) => comment.userId === currentUserId,
  );

  useEffect(() => {
    if (!work || !isAuthorized || pages.length === 0) {
      return;
    }

    const savedPage = getSavedReadingPage(currentUserId, work.id);
    const safePage = Math.min(savedPage, pages.length - 1);

    setCurrentPage(safePage);
  }, [work, isAuthorized, currentUserId, pages.length]);

  useEffect(() => {
    if (!work || !isAuthorized || pages.length === 0) {
      return;
    }

    saveReadingPage(currentUserId, work.id, currentPage);
  }, [work, isAuthorized, currentUserId, currentPage, pages.length]);

  if (!work) {
    return (
      <section className="work-details">
        <h1>Твір не знайдено</h1>
        <a className="work-details__back" href="/">
          Повернутися на головну
        </a>
      </section>
    );
  }

  /**
   * Оновлює список коментарів для поточного твору.
   *
   * @param {Array} updatedWorkComments - Оновлені коментарі твору.
   * @returns {void}
   */
  const saveWorkComments = (updatedWorkComments) => {
    const updatedCommentsByWork = {
      ...commentsByWork,
      [work.id]: updatedWorkComments,
    };

    setCommentsByWork(updatedCommentsByWork);
    writeToStorage(COMMENTS_STORAGE_KEY, updatedCommentsByWork);
  };

  /**
   * Перемикає стан твору в обраному.
   *
   * @returns {void}
   */
  const toggleFavorite = () => {
    const updatedFavoriteIds = isFavorite
      ? favoriteIds.filter((favoriteId) => favoriteId !== work.id)
      : [...favoriteIds, work.id];

    setFavoriteIds(updatedFavoriteIds);
    writeToStorage(FAVORITES_STORAGE_KEY, updatedFavoriteIds);
  };

  /**
   * Переходить на попередню сторінку твору.
   *
   * @returns {void}
   */
  const goToPreviousPage = () => {
    setCurrentPage((page) => Math.max(page - 1, 0));
  };

  /**
   * Переходить на наступну сторінку твору.
   *
   * @returns {void}
   */
  const goToNextPage = () => {
    setCurrentPage((page) => Math.min(page + 1, pages.length - 1));
  };

  /**
   * Додає коментар користувача разом з оцінкою.
   *
   * @param {React.FormEvent<HTMLFormElement>} event - Подія submit.
   * @returns {void}
   */
  const handleCommentSubmit = (event) => {
    event.preventDefault();

    if (!isAuthorized || hasUserCommented) {
      return;
    }

    const normalizedText = commentText.trim();

    if (!normalizedText) {
      return;
    }

    const newComment = {
      id: Date.now(),
      userId: currentUserId,
      author: commentAuthor,
      text: normalizedText,
      rating: Number(commentRating),
      likedBy: [],
      createdAt: new Date().toLocaleDateString("uk-UA"),
      updatedAt: "",
    };

    saveWorkComments([...workComments, newComment]);

    setCommentText("");
    setCommentRating("5");
  };

  /**
   * Вмикає режим редагування власного коментаря.
   *
   * @param {Object} comment - Коментар для редагування.
   * @returns {void}
   */
  const startEditingComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditingText(comment.text);
    setEditingRating(String(comment.rating));
  };

  /**
   * Скасовує редагування коментаря.
   *
   * @returns {void}
   */
  const cancelEditingComment = () => {
    setEditingCommentId(null);
    setEditingText("");
    setEditingRating("5");
  };

  /**
   * Зберігає змінений коментар користувача.
   *
   * @param {React.FormEvent<HTMLFormElement>} event - Подія submit.
   * @returns {void}
   */
  const handleEditSubmit = (event) => {
    event.preventDefault();

    const normalizedText = editingText.trim();

    if (!normalizedText) {
      return;
    }

    const updatedComments = workComments.map((comment) => {
      const isOwnComment = comment.userId === currentUserId;
      const isEditedComment = comment.id === editingCommentId;

      if (!isOwnComment || !isEditedComment) {
        return comment;
      }

      return {
        ...comment,
        text: normalizedText,
        rating: Number(editingRating),
        updatedAt: new Date().toLocaleDateString("uk-UA"),
      };
    });

    saveWorkComments(updatedComments);
    cancelEditingComment();
  };

  /**
   * Додає або прибирає лайк з коментаря.
   *
   * @param {number|string} commentId - ID коментаря.
   * @returns {void}
   */
  const toggleCommentLike = (commentId) => {
    if (!isAuthorized) {
      return;
    }

    const updatedComments = workComments.map((comment) => {
      if (comment.id !== commentId) {
        return comment;
      }

      const likedBy = comment.likedBy || [];
      const isLiked = likedBy.includes(currentUserId);

      return {
        ...comment,
        likedBy: isLiked
          ? likedBy.filter((userId) => userId !== currentUserId)
          : [...likedBy, currentUserId],
      };
    });

    saveWorkComments(updatedComments);
  };

  /**
   * Видаляє власний коментар користувача.
   *
   * @param {number|string} commentId - ID коментаря.
   * @returns {void}
   */
  const deleteOwnComment = (commentId) => {
    const shouldDelete = window.confirm(
      "Ви впевнені, що хочете видалити цей коментар?",
    );

    if (!shouldDelete) {
      return;
    }

    const updatedComments = workComments.filter((comment) => {
      return comment.id !== commentId || comment.userId !== currentUserId;
    });

    saveWorkComments(updatedComments);

    if (editingCommentId === commentId) {
      cancelEditingComment();
    }
  };

  return (
    <section className="work-details">
      <a className="work-details__back" href="/">
        ← До каталогу
      </a>

      <div className="work-details__header">
        <div className="work-details__cover-wrapper">
          <img
            className="work-details__cover"
            src={work.cover}
            alt={work.title}
          />
        </div>

        <div className="work-details__info">
          <h1 className="work-details__title">{work.title}</h1>
          <p className="work-details__author">{work.author}</p>

          <div className="work-details__meta">
            <span>{work.genre}</span>

            <span>
              Рейтинг:{" "}
              {ratingStats.rating > 0 ? ratingStats.rating.toFixed(1) : "—"}
            </span>

            <span>
              {ratingStats.ratingsCount > 0
                ? `Оцінок користувачів: ${ratingStats.ratingsCount}`
                : "Оцінок користувачів ще немає"}
            </span>
          </div>

          <p className="work-details__description">{work.description}</p>

          <button
            className={`work-details__favorite ${
              isFavorite ? "work-details__favorite--active" : ""
            }`}
            type="button"
            onClick={toggleFavorite}
          >
            {isFavorite ? "В обраному" : "Додати в обране"}
          </button>
        </div>
      </div>

      <div className="reader">
        <div className="reader__top">
          <h2 className="reader__title">Читати твір</h2>

          {pages.length > 0 && (
            <span className="reader__counter">
              Сторінка {currentPage + 1} з {pages.length}
            </span>
          )}
        </div>

        <div className="reader__page">{renderParagraphs(pageText)}</div>

        {pages.length > 1 && (
          <div className="reader__controls">
            <button
              className="reader__button"
              type="button"
              onClick={goToPreviousPage}
              disabled={currentPage === 0}
            >
              Попередня
            </button>

            <button
              className="reader__button"
              type="button"
              onClick={goToNextPage}
              disabled={currentPage === pages.length - 1}
            >
              Наступна
            </button>
          </div>
        )}
      </div>

      <section className="comments">
        <h2 className="comments__title">Коментарі та оцінки</h2>

        {isAuthorized && !hasUserCommented ? (
          <form className="comments__form" onSubmit={handleCommentSubmit}>
            <label className="comments__label">
              Оцінка
              <select
                className="comments__select"
                value={commentRating}
                onChange={(event) => setCommentRating(event.target.value)}
              >
                <option value="5">5</option>
                <option value="4">4</option>
                <option value="3">3</option>
                <option value="2">2</option>
                <option value="1">1</option>
              </select>
            </label>

            <label className="comments__label">
              Коментар
              <textarea
                className="comments__textarea"
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                placeholder="Напишіть вашу думку про твір..."
                rows="5"
              />
            </label>

            <button className="comments__submit" type="submit">
              Додати коментар
            </button>
          </form>
        ) : isAuthorized ? (
          <div className="comments__auth-message">
            Ви вже залишили коментар до цього твору.
          </div>
        ) : (
          <div className="comments__auth-message">
            Щоб залишити коментар і оцінку, потрібно увійти в акаунт.
            <a className="comments__auth-link" href="/login">
              Увійти
            </a>
          </div>
        )}

        <div className="comments__list">
          {workComments.length === 0 ? (
            <p className="comments__empty">Коментарів поки немає.</p>
          ) : (
            workComments.map((comment) => {
              const isOwnComment = comment.userId === currentUserId;
              const isEditing = editingCommentId === comment.id;
              const likedBy = comment.likedBy || [];
              const isLikedByCurrentUser = likedBy.includes(currentUserId);

              return (
                <article className="comments__item" key={comment.id}>
                  <div className="comments__item-header">
                    <strong>{comment.author}</strong>

                    <span className="comments__item-rating">
                      Оцінка: {comment.rating}/5
                    </span>
                  </div>

                  {isEditing ? (
                    <form
                      className="comments__edit-form"
                      onSubmit={handleEditSubmit}
                    >
                      <label className="comments__label">
                        Нова оцінка
                        <select
                          className="comments__select"
                          value={editingRating}
                          onChange={(event) =>
                            setEditingRating(event.target.value)
                          }
                        >
                          <option value="5">5</option>
                          <option value="4">4</option>
                          <option value="3">3</option>
                          <option value="2">2</option>
                          <option value="1">1</option>
                        </select>
                      </label>

                      <label className="comments__label">
                        Новий коментар
                        <textarea
                          className="comments__textarea"
                          value={editingText}
                          onChange={(event) =>
                            setEditingText(event.target.value)
                          }
                          rows="4"
                        />
                      </label>

                      <div className="comments__actions">
                        <button className="comments__submit" type="submit">
                          Зберегти
                        </button>

                        <button
                          className="comments__secondary-button"
                          type="button"
                          onClick={cancelEditingComment}
                        >
                          Скасувати
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <p className="comments__item-text">{comment.text}</p>

                      <div className="comments__footer">
                        <div className="comments__dates">
                          <span className="comments__date">
                            {comment.createdAt}
                          </span>

                          {comment.updatedAt && (
                            <span className="comments__date">
                              Змінено: {comment.updatedAt}
                            </span>
                          )}
                        </div>

                        <div className="comments__actions">
                          <button
                            className={`comments__like ${
                              isLikedByCurrentUser
                                ? "comments__like--active"
                                : ""
                            }`}
                            type="button"
                            onClick={() => toggleCommentLike(comment.id)}
                            disabled={!isAuthorized}
                          >
                            👍 {likedBy.length}
                          </button>

                          {isOwnComment && (
                            <>
                              <button
                                className="comments__secondary-button"
                                type="button"
                                onClick={() => startEditingComment(comment)}
                              >
                                Редагувати
                              </button>

                              <button
                                className="comments__delete-button"
                                type="button"
                                onClick={() => deleteOwnComment(comment.id)}
                              >
                                Видалити
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </article>
              );
            })
          )}
        </div>
      </section>
    </section>
  );
}