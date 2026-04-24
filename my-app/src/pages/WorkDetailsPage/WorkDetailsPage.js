import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import worksData from "../../data/works.json";
import "./WorkDetailsPage.css";

const FAVORITES_STORAGE_KEY = "favoriteWorks";
const COMMENTS_STORAGE_KEY = "workComments";

/**
 * Безпечно отримує JSON-дані з localStorage.
 *
 * @param {string} key - Ключ localStorage
 * @param {Object|Array|string|number|boolean|null} fallback - Значення за замовчуванням
 * @returns {Object|Array|string|number|boolean|null} Дані з localStorage або fallback
 */
function readFromStorage(key, fallback) {
  try {
    const savedValue = localStorage.getItem(key);
    return savedValue ? JSON.parse(savedValue) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Записує JSON-дані у localStorage.
 *
 * @param {string} key - Ключ localStorage
 * @param {Object|Array|string|number|boolean|null} value - Значення для збереження
 * @returns {void}
 */
function writeToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * Розбиває текст сторінки на абзаци.
 *
 * @param {string} text - Текст сторінки твору
 * @returns {JSX.Element[]} Масив абзаців
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
 * @param {Object.<string, Array>} commentsByWork - Об'єкт коментарів
 * @param {number|string} workId - ID твору
 * @returns {Array} Масив коментарів твору
 */
function getWorkComments(commentsByWork, workId) {
  return commentsByWork[String(workId)] || [];
}

/**
 * Сторінка детального перегляду твору.
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

  const work = useMemo(() => {
    return worksData.find((item) => String(item.id) === String(id));
  }, [id]);

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

  const pages = work.pages || [];
  const pageText = pages[currentPage] || "Текст твору поки не додано.";
  const isFavorite = favoriteIds.includes(work.id);
  const workComments = getWorkComments(commentsByWork, work.id);

  const isAuthorized = Boolean(user);

  const commentAuthor = isAuthorized
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.login
    : "";

  const currentUserId = isAuthorized ? user.id || user.login || user.email : "";

  const hasUserCommented = workComments.some(
    (comment) => comment.userId === currentUserId,
  );

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
      createdAt: new Date().toLocaleDateString("uk-UA"),
    };

    const updatedCommentsByWork = {
      ...commentsByWork,
      [work.id]: [...workComments, newComment],
    };

    setCommentsByWork(updatedCommentsByWork);
    writeToStorage(COMMENTS_STORAGE_KEY, updatedCommentsByWork);

    setCommentText("");
    setCommentRating("5");
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
            <span>Рейтинг: {work.rating.toFixed(1)}</span>
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
            workComments.map((comment) => (
              <article className="comments__item" key={comment.id}>
                <div className="comments__item-header">
                  <strong>{comment.author}</strong>
                  <span className="comments__item-rating">
                    Оцінка: {comment.rating}/5
                  </span>
                </div>

                <p className="comments__item-text">{comment.text}</p>
                <span className="comments__date">{comment.createdAt}</span>
              </article>
            ))
          )}
        </div>
      </section>
    </section>
  );
}