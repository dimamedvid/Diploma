import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { getWorkById } from "../../api/worksApi";
import {
  createWorkComment,
  deleteComment,
  getWorkComments,
  toggleCommentLike,
  updateComment,
} from "../../api/commentsApi";
import {
  getFavoriteWorkIdsFromApi,
  getReadingProgressFromApi,
  saveReadingProgressToApi,
  toggleFavoriteWorkInApi,
} from "../../api/userActivityApi";
import "./WorkDetailsPage.css";

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
 * Повертає стабільний ID користувача.
 *
 * @param {Object|null} user - Дані користувача.
 * @returns {string} ID користувача.
 */
function getCurrentUserId(user) {
  return String(user?.id || user?.login || user?.email || "");
}

/**
 * Рахує рейтинг твору на основі коментарів.
 *
 * @param {Object[]} comments - Коментарі твору.
 * @returns {{ rating: number, ratingsCount: number }} Статистика рейтингу.
 */
function getRatingStats(comments) {
  if (comments.length === 0) {
    return {
      rating: 0,
      ratingsCount: 0,
    };
  }

  const ratingSum = comments.reduce((sum, comment) => {
    return sum + Number(comment.rating || 0);
  }, 0);

  return {
    rating: ratingSum / comments.length,
    ratingsCount: comments.length,
  };
}

/**
 * Форматує дату для відображення.
 *
 * @param {string} value - Дата з backend.
 * @returns {string} Дата у форматі uk-UA.
 */
function formatDate(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleDateString("uk-UA");
}

/**
 * Сторінка детального перегляду твору.
 *
 * @returns {JSX.Element}
 */
export default function WorkDetailsPage() {
  const { id } = useParams();
  const { user, token } = useSelector((state) => state.auth);

  const [work, setWork] = useState(null);
  const [isWorkLoading, setIsWorkLoading] = useState(true);
  const [workError, setWorkError] = useState("");

  const [comments, setComments] = useState([]);
  const [isCommentsLoading, setIsCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState("");

  const [currentPage, setCurrentPage] = useState(0);
  const [hasLoadedReadingProgress, setHasLoadedReadingProgress] =
    useState(false);

  const [favoriteIds, setFavoriteIds] = useState([]);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

  const [commentText, setCommentText] = useState("");
  const [commentRating, setCommentRating] = useState("5");
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [editingRating, setEditingRating] = useState("5");
  const [processingCommentId, setProcessingCommentId] = useState(null);

  const isAuthorized = Boolean(user && token);
  const currentUserId = getCurrentUserId(user);

  const pages = useMemo(() => {
    return work?.pages || [];
  }, [work]);

  const pageText = pages[currentPage] || "Текст твору поки не додано.";

  const isFavorite = work
    ? favoriteIds.some((favoriteId) => String(favoriteId) === String(work.id))
    : false;

  const ratingStats = useMemo(() => {
    return getRatingStats(comments);
  }, [comments]);

  const hasUserCommented = comments.some(
    (comment) => String(comment.userId) === String(currentUserId),
  );

  useEffect(() => {
    let isMounted = true;

    const loadWork = async () => {
      try {
        setIsWorkLoading(true);
        setWorkError("");
        setHasLoadedReadingProgress(false);

        const workFromApi = await getWorkById(id);

        if (!isMounted) {
          return;
        }

        setWork(workFromApi);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setWorkError(
          error.message || "Не вдалося завантажити твір. Перевірте backend.",
        );
      } finally {
        if (isMounted) {
          setIsWorkLoading(false);
        }
      }
    };

    loadWork();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    let isMounted = true;

    const loadComments = async () => {
      try {
        setIsCommentsLoading(true);
        setCommentsError("");

        const commentsFromApi = await getWorkComments(id);

        if (!isMounted) {
          return;
        }

        setComments(commentsFromApi);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setCommentsError(
          error.message ||
            "Не вдалося завантажити коментарі. Перевірте backend.",
        );
      } finally {
        if (isMounted) {
          setIsCommentsLoading(false);
        }
      }
    };

    loadComments();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    let isMounted = true;

    const loadFavoriteWorks = async () => {
      if (!token) {
        setFavoriteIds([]);
        return;
      }

      try {
        const ids = await getFavoriteWorkIdsFromApi(token);

        if (!isMounted) {
          return;
        }

        setFavoriteIds(ids);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setWorkError(
          error.message ||
            "Не вдалося завантажити обрані твори. Перевірте backend.",
        );
      }
    };

    loadFavoriteWorks();

    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    let isMounted = true;

    const loadReadingProgress = async () => {
      if (!work || !token || pages.length === 0) {
        setHasLoadedReadingProgress(true);
        return;
      }

      try {
        const progress = await getReadingProgressFromApi(token);

        if (!isMounted) {
          return;
        }

        const currentWorkProgress = progress.find(
          (item) => String(item.workId) === String(work.id),
        );

        if (currentWorkProgress) {
          const savedPage = Number(currentWorkProgress.currentPage || 0);
          const safePage = Math.min(Math.max(savedPage, 0), pages.length - 1);

          setCurrentPage(safePage);
        } else {
          setCurrentPage(0);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setWorkError(
          error.message ||
            "Не вдалося завантажити прогрес читання. Перевірте backend.",
        );
      } finally {
        if (isMounted) {
          setHasLoadedReadingProgress(true);
        }
      }
    };

    loadReadingProgress();

    return () => {
      isMounted = false;
    };
  }, [work, token, pages.length]);

  useEffect(() => {
    if (
      !work ||
      !isAuthorized ||
      !hasLoadedReadingProgress ||
      pages.length === 0
    ) {
      return;
    }

    saveReadingProgressToApi(work.id, currentPage, token).catch(() => {});
  }, [
    work,
    isAuthorized,
    token,
    currentPage,
    pages.length,
    hasLoadedReadingProgress,
  ]);

  /**
   * Перемикає стан твору в обраному через backend.
   *
   * @returns {Promise<void>}
   */
  const toggleFavorite = async () => {
    if (!isAuthorized) {
      setWorkError("Щоб додати твір в обране, потрібно увійти в акаунт.");
      return;
    }

    try {
      setIsFavoriteLoading(true);
      setWorkError("");

      const result = await toggleFavoriteWorkInApi(work.id, token);

      setFavoriteIds((ids) => {
        if (result.isFavorite) {
          return [...ids, String(result.workId)];
        }

        return ids.filter((favoriteId) => String(favoriteId) !== String(work.id));
      });
    } catch (error) {
      setWorkError(
        error.message ||
          "Не вдалося змінити обране. Перевірте backend і спробуйте ще раз.",
      );
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  const goToPreviousPage = () => {
    setCurrentPage((page) => Math.max(page - 1, 0));
  };

  const goToNextPage = () => {
    setCurrentPage((page) => Math.min(page + 1, pages.length - 1));
  };

  const handleCommentSubmit = async (event) => {
    event.preventDefault();

    if (!isAuthorized || hasUserCommented) {
      return;
    }

    const normalizedText = commentText.trim();

    if (!normalizedText) {
      setCommentsError("Текст коментаря є обов'язковим.");
      return;
    }

    try {
      setIsCommentSubmitting(true);
      setCommentsError("");

      const createdComment = await createWorkComment(
        work.id,
        {
          text: normalizedText,
          rating: Number(commentRating),
        },
        token,
      );

      setComments((previousComments) => [createdComment, ...previousComments]);
      setCommentText("");
      setCommentRating("5");
    } catch (error) {
      setCommentsError(
        error.message ||
          "Не вдалося додати коментар. Перевірте backend і спробуйте ще раз.",
      );
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  const startEditingComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditingText(comment.text);
    setEditingRating(String(comment.rating));
    setCommentsError("");
  };

  const cancelEditingComment = () => {
    setEditingCommentId(null);
    setEditingText("");
    setEditingRating("5");
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();

    const normalizedText = editingText.trim();

    if (!normalizedText) {
      setCommentsError("Текст коментаря є обов'язковим.");
      return;
    }

    try {
      setProcessingCommentId(editingCommentId);
      setCommentsError("");

      const updatedComment = await updateComment(
        editingCommentId,
        {
          text: normalizedText,
          rating: Number(editingRating),
        },
        token,
      );

      setComments((previousComments) =>
        previousComments.map((comment) =>
          String(comment.id) === String(updatedComment.id)
            ? updatedComment
            : comment,
        ),
      );

      cancelEditingComment();
    } catch (error) {
      setCommentsError(
        error.message ||
          "Не вдалося оновити коментар. Перевірте backend і спробуйте ще раз.",
      );
    } finally {
      setProcessingCommentId(null);
    }
  };

  const handleToggleCommentLike = async (commentId) => {
    if (!isAuthorized) {
      return;
    }

    try {
      setProcessingCommentId(commentId);
      setCommentsError("");

      const updatedComment = await toggleCommentLike(commentId, token);

      setComments((previousComments) =>
        previousComments.map((comment) =>
          String(comment.id) === String(updatedComment.id)
            ? updatedComment
            : comment,
        ),
      );
    } catch (error) {
      setCommentsError(
        error.message ||
          "Не вдалося змінити лайк. Перевірте backend і спробуйте ще раз.",
      );
    } finally {
      setProcessingCommentId(null);
    }
  };

  const deleteOwnComment = async (commentId) => {
    const shouldDelete = window.confirm(
      "Ви впевнені, що хочете видалити цей коментар?",
    );

    if (!shouldDelete) {
      return;
    }

    try {
      setProcessingCommentId(commentId);
      setCommentsError("");

      await deleteComment(commentId, token);

      setComments((previousComments) =>
        previousComments.filter(
          (comment) => String(comment.id) !== String(commentId),
        ),
      );

      if (String(editingCommentId) === String(commentId)) {
        cancelEditingComment();
      }
    } catch (error) {
      setCommentsError(
        error.message ||
          "Не вдалося видалити коментар. Перевірте backend і спробуйте ще раз.",
      );
    } finally {
      setProcessingCommentId(null);
    }
  };

  if (isWorkLoading) {
    return (
      <section className="work-details">
        <h1>Завантаження твору...</h1>
      </section>
    );
  }

  if (!work) {
    return (
      <section className="work-details">
        <h1>Твір не знайдено</h1>

        {workError && <p className="work-details__description">{workError}</p>}

        <a className="work-details__back" href="/">
          Повернутися на головну
        </a>
      </section>
    );
  }

  return (
    <section className="work-details">
      <a className="work-details__back" href="/">
        ← До каталогу
      </a>

      {workError && <p className="work-details__description">{workError}</p>}

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
            disabled={isFavoriteLoading}
          >
            {isFavoriteLoading
              ? "Оновлюємо..."
              : isFavorite
                ? "В обраному"
                : "Додати в обране"}
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

        {commentsError && (
          <div className="comments__auth-message">{commentsError}</div>
        )}

        {isAuthorized && !hasUserCommented ? (
          <form className="comments__form" onSubmit={handleCommentSubmit}>
            <label className="comments__label">
              Оцінка
              <select
                className="comments__select"
                value={commentRating}
                onChange={(event) => setCommentRating(event.target.value)}
                disabled={isCommentSubmitting}
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
                disabled={isCommentSubmitting}
              />
            </label>

            <button
              className="comments__submit"
              type="submit"
              disabled={isCommentSubmitting}
            >
              {isCommentSubmitting ? "Додаємо..." : "Додати коментар"}
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
          {isCommentsLoading ? (
            <p className="comments__empty">Завантажуємо коментарі...</p>
          ) : comments.length === 0 ? (
            <p className="comments__empty">Коментарів поки немає.</p>
          ) : (
            comments.map((comment) => {
              const isOwnComment =
                String(comment.userId) === String(currentUserId);
              const isEditing =
                String(editingCommentId) === String(comment.id);
              const likedBy = comment.likedBy || [];
              const isLikedByCurrentUser = likedBy.includes(currentUserId);
              const isProcessing =
                String(processingCommentId) === String(comment.id);

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
                          disabled={isProcessing}
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
                          disabled={isProcessing}
                        />
                      </label>

                      <div className="comments__actions">
                        <button
                          className="comments__submit"
                          type="submit"
                          disabled={isProcessing}
                        >
                          {isProcessing ? "Зберігаємо..." : "Зберегти"}
                        </button>

                        <button
                          className="comments__secondary-button"
                          type="button"
                          onClick={cancelEditingComment}
                          disabled={isProcessing}
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
                            {formatDate(comment.createdAt)}
                          </span>

                          {comment.updatedAt &&
                            comment.updatedAt !== comment.createdAt && (
                            <span className="comments__date">
                              Змінено: {formatDate(comment.updatedAt)}
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
                            onClick={() => handleToggleCommentLike(comment.id)}
                            disabled={!isAuthorized || isProcessing}
                          >
                            👍 {comment.likesCount || likedBy.length}
                          </button>

                          {isOwnComment && (
                            <>
                              <button
                                className="comments__secondary-button"
                                type="button"
                                onClick={() => startEditingComment(comment)}
                                disabled={isProcessing}
                              >
                                Редагувати
                              </button>

                              <button
                                className="comments__delete-button"
                                type="button"
                                onClick={() => deleteOwnComment(comment.id)}
                                disabled={isProcessing}
                              >
                                {isProcessing ? "Видаляємо..." : "Видалити"}
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