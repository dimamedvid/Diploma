import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../../store/authSlice";
import {
  getUserFullName,
  getUserId,
} from "../../utils/worksStorage";
import {
  MAX_FAVORITE_GENRES,
  getAvailableGenres,
} from "../../utils/favoriteGenresStorage";
import { deleteWork, getMyWorks, getWorks } from "../../api/worksApi";
import {
  deleteComment,
  getMyComments,
  updateComment,
} from "../../api/commentsApi";
import {
  deleteReadingProgressFromApi,
  getFavoriteGenresFromApi,
  getFavoriteWorkIdsFromApi,
  getReadingProgressFromApi,
  saveFavoriteGenresToApi,
} from "../../api/userActivityApi";
import "./CabinetPage.css";

/**
 * Повертає зручний статус твору для відображення в кабінеті.
 *
 * @param {Object} work - Твір з backend.
 * @returns {Object} Твір зі статусом для UI.
 */
function mapUserWorkStatus(work) {
  const statusMap = {
    pending: "На модерації",
    approved: "Опубліковано",
    rejected: "Відхилено",
  };

  return {
    ...work,
    statusType: work.status,
    displayStatus: statusMap[work.status] || "Невідомий статус",
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
 * Сторінка особистого кабінету авторизованого користувача.
 *
 * @returns {JSX.Element} Сторінка особистого кабінету.
 */
export default function CabinetPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);

  const [worksFilter, setWorksFilter] = useState("all");

  const [publishedWorks, setPublishedWorks] = useState([]);
  const [publishedWorksError, setPublishedWorksError] = useState("");

  const [favoriteWorkIds, setFavoriteWorkIds] = useState([]);
  const [favoriteGenres, setFavoriteGenres] = useState([]);
  const [favoriteGenresError, setFavoriteGenresError] = useState("");
  const [isFavoriteGenresSaving, setIsFavoriteGenresSaving] = useState(false);

  const [readingProgress, setReadingProgress] = useState([]);
  const [isReadingProgressLoading, setIsReadingProgressLoading] = useState(true);
  const [readingProgressError, setReadingProgressError] = useState("");
  const [deletingProgressWorkId, setDeletingProgressWorkId] = useState(null);

  const [userWorks, setUserWorks] = useState([]);
  const [isUserWorksLoading, setIsUserWorksLoading] = useState(true);
  const [userWorksError, setUserWorksError] = useState("");
  const [deletingWorkId, setDeletingWorkId] = useState(null);

  const [userComments, setUserComments] = useState([]);
  const [isUserCommentsLoading, setIsUserCommentsLoading] = useState(true);
  const [userCommentsError, setUserCommentsError] = useState("");
  const [processingCommentId, setProcessingCommentId] = useState(null);

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [editingCommentRating, setEditingCommentRating] = useState("5");

  const userId = getUserId(user);
  const userFullName = getUserFullName(user);

  const availableGenres = useMemo(() => {
    return getAvailableGenres(publishedWorks);
  }, [publishedWorks]);

  const favoriteWorks = useMemo(() => {
    return publishedWorks.filter((work) =>
      favoriteWorkIds.some((favoriteId) => String(favoriteId) === String(work.id)),
    );
  }, [publishedWorks, favoriteWorkIds]);

  const filteredUserWorks = userWorks.filter((work) => {
    if (worksFilter === "all") {
      return true;
    }

    return work.statusType === worksFilter;
  });

  useEffect(() => {
    let isMounted = true;

    const loadPublishedWorks = async () => {
      try {
        setPublishedWorksError("");

        const works = await getWorks();

        if (!isMounted) {
          return;
        }

        setPublishedWorks(works);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setPublishedWorksError(
          error.message ||
            "Не вдалося завантажити опубліковані твори для обраного.",
        );
      }
    };

    loadPublishedWorks();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadUserWorks = async () => {
      if (!token) {
        setIsUserWorksLoading(false);
        setUserWorksError("Щоб переглянути власні твори, потрібно увійти.");
        return;
      }

      try {
        setIsUserWorksLoading(true);
        setUserWorksError("");

        const works = await getMyWorks(token);

        if (!isMounted) {
          return;
        }

        setUserWorks(works.map(mapUserWorkStatus));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setUserWorksError(
          error.message ||
            "Не вдалося завантажити ваші твори. Перевірте backend.",
        );
      } finally {
        if (isMounted) {
          setIsUserWorksLoading(false);
        }
      }
    };

    loadUserWorks();

    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    let isMounted = true;

    const loadUserComments = async () => {
      if (!token) {
        setIsUserCommentsLoading(false);
        setUserCommentsError(
          "Щоб переглянути власні коментарі, потрібно увійти.",
        );
        return;
      }

      try {
        setIsUserCommentsLoading(true);
        setUserCommentsError("");

        const comments = await getMyComments(token);

        if (!isMounted) {
          return;
        }

        setUserComments(comments);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setUserCommentsError(
          error.message ||
            "Не вдалося завантажити ваші коментарі. Перевірте backend.",
        );
      } finally {
        if (isMounted) {
          setIsUserCommentsLoading(false);
        }
      }
    };

    loadUserComments();

    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    let isMounted = true;

    const loadUserActivity = async () => {
      if (!token) {
        setIsReadingProgressLoading(false);
        return;
      }

      try {
        setIsReadingProgressLoading(true);
        setReadingProgressError("");
        setFavoriteGenresError("");

        const [favoriteIds, progress, genres] = await Promise.all([
          getFavoriteWorkIdsFromApi(token),
          getReadingProgressFromApi(token),
          getFavoriteGenresFromApi(token),
        ]);

        if (!isMounted) {
          return;
        }

        setFavoriteWorkIds(favoriteIds);
        setReadingProgress(progress);
        setFavoriteGenres(genres);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setReadingProgressError(
          error.message ||
            "Не вдалося завантажити обране, прогрес читання або жанри.",
        );
      } finally {
        if (isMounted) {
          setIsReadingProgressLoading(false);
        }
      }
    };

    loadUserActivity();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const onLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const toggleFavoriteGenre = async (genre) => {
    if (!token) {
      setFavoriteGenresError("Щоб обрати улюблені жанри, потрібно увійти.");
      return;
    }

    const isSelected = favoriteGenres.includes(genre);

    if (!isSelected && favoriteGenres.length >= MAX_FAVORITE_GENRES) {
      setFavoriteGenresError(
        `Можна обрати не більше ${MAX_FAVORITE_GENRES} жанрів.`,
      );
      return;
    }

    const updatedGenres = isSelected
      ? favoriteGenres.filter((item) => item !== genre)
      : [...favoriteGenres, genre];

    try {
      setIsFavoriteGenresSaving(true);
      setFavoriteGenresError("");

      const savedGenres = await saveFavoriteGenresToApi(updatedGenres, token);

      setFavoriteGenres(savedGenres);
    } catch (error) {
      setFavoriteGenresError(
        error.message ||
          "Не вдалося зберегти улюблені жанри. Перевірте backend.",
      );
    } finally {
      setIsFavoriteGenresSaving(false);
    }
  };

  const deleteReadingProgress = async (workId) => {
    const shouldDelete = window.confirm(
      "Прибрати цей твір зі списку продовження читання?",
    );

    if (!shouldDelete) {
      return;
    }

    if (!token) {
      setReadingProgressError("Щоб прибрати прогрес, потрібно увійти.");
      return;
    }

    try {
      setDeletingProgressWorkId(workId);
      setReadingProgressError("");

      await deleteReadingProgressFromApi(workId, token);

      setReadingProgress((progress) =>
        progress.filter((item) => String(item.workId) !== String(workId)),
      );
    } catch (error) {
      setReadingProgressError(
        error.message ||
          "Не вдалося прибрати прогрес читання. Перевірте backend.",
      );
    } finally {
      setDeletingProgressWorkId(null);
    }
  };

  const deleteOwnWork = async (workId) => {
    const shouldDelete = window.confirm(
      "Ви впевнені, що хочете видалити цей твір? Його буде видалено з бази даних.",
    );

    if (!shouldDelete) {
      return;
    }

    if (!token) {
      setUserWorksError("Щоб видалити твір, потрібно увійти в акаунт.");
      return;
    }

    try {
      setDeletingWorkId(workId);
      setUserWorksError("");

      await deleteWork(workId, token);

      setUserWorks((works) =>
        works.filter((work) => String(work.id) !== String(workId)),
      );

      setReadingProgress((progress) =>
        progress.filter((item) => String(item.workId) !== String(workId)),
      );

      setFavoriteWorkIds((ids) =>
        ids.filter((favoriteId) => String(favoriteId) !== String(workId)),
      );
    } catch (error) {
      setUserWorksError(
        error.message ||
          "Не вдалося видалити твір. Перевірте backend і спробуйте ще раз.",
      );
    } finally {
      setDeletingWorkId(null);
    }
  };

  const startEditingComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.text);
    setEditingCommentRating(String(comment.rating));
    setUserCommentsError("");
  };

  const cancelEditingComment = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
    setEditingCommentRating("5");
  };

  const saveEditedComment = async (event, commentId) => {
    event.preventDefault();

    const normalizedText = editingCommentText.trim();

    if (!normalizedText) {
      setUserCommentsError("Текст коментаря є обов'язковим.");
      return;
    }

    if (!token) {
      setUserCommentsError("Щоб редагувати коментар, потрібно увійти.");
      return;
    }

    try {
      setProcessingCommentId(commentId);
      setUserCommentsError("");

      await updateComment(
        commentId,
        {
          text: normalizedText,
          rating: Number(editingCommentRating),
        },
        token,
      );

      setUserComments((comments) =>
        comments.map((comment) =>
          String(comment.id) === String(commentId)
            ? {
              ...comment,
              text: normalizedText,
              rating: Number(editingCommentRating),
              updatedAt: new Date().toISOString(),
            }
            : comment,
        ),
      );

      cancelEditingComment();
    } catch (error) {
      setUserCommentsError(
        error.message ||
          "Не вдалося оновити коментар. Перевірте backend і спробуйте ще раз.",
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

    if (!token) {
      setUserCommentsError("Щоб видалити коментар, потрібно увійти.");
      return;
    }

    try {
      setProcessingCommentId(commentId);
      setUserCommentsError("");

      await deleteComment(commentId, token);

      setUserComments((comments) =>
        comments.filter((comment) => String(comment.id) !== String(commentId)),
      );

      if (String(editingCommentId) === String(commentId)) {
        cancelEditingComment();
      }
    } catch (error) {
      setUserCommentsError(
        error.message ||
          "Не вдалося видалити коментар. Перевірте backend і спробуйте ще раз.",
      );
    } finally {
      setProcessingCommentId(null);
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
              Обрано {favoriteGenres.length} з {MAX_FAVORITE_GENRES}
            </span>
          </div>

          <p className="cabinet__genres-text">
            Оберіть до трьох жанрів. На головній сторінці твори цих жанрів
            будуть показуватись першими.
          </p>

          {favoriteGenresError && (
            <p className="cabinet__empty">{favoriteGenresError}</p>
          )}

          <div className="cabinet__genres-list">
            {availableGenres.map((genreName) => {
              const isSelected = favoriteGenres.includes(genreName);
              const isDisabled =
                isFavoriteGenresSaving ||
                (!isSelected &&
                  favoriteGenres.length >= MAX_FAVORITE_GENRES);

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

        {isReadingProgressLoading && (
          <p className="cabinet__empty">Завантажуємо прогрес читання...</p>
        )}

        {!isReadingProgressLoading && readingProgressError && (
          <p className="cabinet__empty">{readingProgressError}</p>
        )}

        {!isReadingProgressLoading &&
          !readingProgressError &&
          readingProgress.length === 0 && (
          <p className="cabinet__empty">
            Ви ще не починали читати твори.
          </p>
        )}

        {!isReadingProgressLoading &&
          !readingProgressError &&
          readingProgress.length > 0 && (
          <div className="cabinet__list">
            {readingProgress.map((work) => {
              const isDeleting =
                  String(deletingProgressWorkId) === String(work.workId);

              return (
                <article className="cabinet__work" key={work.workId}>
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
                      <Link
                        className="cabinet__link"
                        to={`/works/${work.workId}`}
                      >
                        Продовжити читання
                      </Link>

                      <button
                        className="cabinet__delete"
                        type="button"
                        onClick={() => deleteReadingProgress(work.workId)}
                        disabled={isDeleting}
                      >
                        {isDeleting ? "Прибираємо..." : "Прибрати"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
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

        {isUserWorksLoading && (
          <p className="cabinet__empty">Завантажуємо ваші твори...</p>
        )}

        {!isUserWorksLoading && userWorksError && (
          <p className="cabinet__empty">{userWorksError}</p>
        )}

        {!isUserWorksLoading &&
          !userWorksError &&
          filteredUserWorks.length === 0 && (
          <p className="cabinet__empty">
            Немає творів для вибраного фільтра.
          </p>
        )}

        {!isUserWorksLoading &&
          !userWorksError &&
          filteredUserWorks.length > 0 && (
          <div className="cabinet__list">
            {filteredUserWorks.map((work) => {
              const isDeleting =
                  String(deletingWorkId) === String(work.id);

              return (
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
                        Твір опубліковано{" "}
                        {work.approvedAt ? formatDate(work.approvedAt) : ""}.
                      </span>
                    )}

                    {work.statusType === "rejected" && (
                      <div className="cabinet__moderation-history">
                        <strong>Причина відхилення:</strong>
                        <p>{work.rejectionReason || "Причину не вказано."}</p>
                        <span>
                          Дата відхилення:{" "}
                          {work.rejectedAt ? formatDate(work.rejectedAt) : "—"}
                        </span>
                      </div>
                    )}

                    <div className="cabinet__work-actions">
                      {work.statusType === "approved" && (
                        <Link
                          className="cabinet__link"
                          to={`/works/${work.id}`}
                        >
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
                        onClick={() => deleteOwnWork(work.id)}
                        disabled={isDeleting}
                      >
                        {isDeleting ? "Видаляємо..." : "Видалити"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="cabinet__section">
        <h2 className="cabinet__section-title">Обрані твори</h2>

        {publishedWorksError && (
          <p className="cabinet__empty">{publishedWorksError}</p>
        )}

        {!publishedWorksError && favoriteWorks.length === 0 ? (
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

        {isUserCommentsLoading && (
          <p className="cabinet__empty">Завантажуємо ваші коментарі...</p>
        )}

        {!isUserCommentsLoading && userCommentsError && (
          <p className="cabinet__empty">{userCommentsError}</p>
        )}

        {!isUserCommentsLoading &&
          !userCommentsError &&
          userComments.length === 0 && (
          <p className="cabinet__empty">
              Ви ще не залишали коментарів до творів.
          </p>
        )}

        {!isUserCommentsLoading &&
          !userCommentsError &&
          userComments.length > 0 && (
          <div className="cabinet__comments">
            {userComments.map((comment) => {
              const isEditing =
                  String(editingCommentId) === String(comment.id);
              const isProcessing =
                  String(processingCommentId) === String(comment.id);

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
                        saveEditedComment(event, comment.id)
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
                          disabled={isProcessing}
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
                          disabled={isProcessing}
                        />
                      </label>

                      <div className="cabinet__comment-edit-actions">
                        <button
                          className="cabinet__comment-save"
                          type="submit"
                          disabled={isProcessing}
                        >
                          {isProcessing ? "Зберігаємо..." : "Зберегти"}
                        </button>

                        <button
                          className="cabinet__delete"
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
                      <p className="cabinet__comment-text">{comment.text}</p>

                      <div className="cabinet__comment-meta">
                        <span className="cabinet__date">
                          {formatDate(comment.createdAt)}
                        </span>

                        {comment.updatedAt &&
                          comment.updatedAt !== comment.createdAt && (
                          <span className="cabinet__date">
                            Змінено: {formatDate(comment.updatedAt)}
                          </span>
                        )}

                        <span className="cabinet__date">
                          Лайків: {comment.likesCount || 0}
                        </span>
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
                          disabled={isProcessing}
                        >
                          Редагувати
                        </button>

                        <button
                          className="cabinet__delete"
                          type="button"
                          onClick={() => deleteOwnComment(comment.id)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? "Видаляємо..." : "Видалити"}
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