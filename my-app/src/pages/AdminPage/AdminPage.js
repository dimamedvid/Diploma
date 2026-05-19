import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  approveWork,
  getPendingWorksForModeration,
  rejectWork,
} from "../../api/worksApi";
import "./AdminPage.css";

/**
 * Розбиває текст сторінки на абзаци.
 *
 * @param {string} text - Текст сторінки.
 * @returns {JSX.Element[]} Масив абзаців.
 */
function renderParagraphs(text) {
  return text
    .split("\n\n")
    .filter(Boolean)
    .map((paragraph, index) => <p key={index}>{paragraph}</p>);
}

/**
 * Перевіряє, чи користувач має доступ до модерації.
 *
 * @param {Object|null} user - Поточний користувач.
 * @returns {boolean} true, якщо роль moderator або admin.
 */
function canModerate(user) {
  return ["moderator", "admin"].includes(user?.role);
}

/**
 * Сторінка модерації користувацьких творів.
 *
 * Завантажує твори зі статусом pending з backend,
 * дозволяє підтверджувати або відхиляти їх через PostgreSQL.
 *
 * @returns {JSX.Element} Сторінка адміністратора/модератора.
 */
export default function AdminPage() {
  const { user, token } = useSelector((state) => state.auth);

  const [pendingWorks, setPendingWorks] = useState([]);
  const [currentPagesByWork, setCurrentPagesByWork] = useState({});
  const [rejectingWorkId, setRejectingWorkId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionError, setRejectionError] = useState("");
  const [pageError, setPageError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [processingWorkId, setProcessingWorkId] = useState(null);

  const pendingCount = useMemo(() => pendingWorks.length, [pendingWorks]);
  const hasAccess = Boolean(token) && canModerate(user);

  useEffect(() => {
    let isMounted = true;

    /**
     * Завантажує твори, які очікують модерації.
     *
     * @returns {Promise<void>}
     */
    const loadPendingWorks = async () => {
      if (!hasAccess) {
        setIsLoading(false);
        setPageError("У вас немає доступу до сторінки модерації.");
        return;
      }

      try {
        setIsLoading(true);
        setPageError("");

        const works = await getPendingWorksForModeration(token);

        if (!isMounted) {
          return;
        }

        setPendingWorks(works);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setPageError(
          error.message ||
            "Не вдалося завантажити твори на модерації. Перевірте backend.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPendingWorks();

    return () => {
      isMounted = false;
    };
  }, [hasAccess, token]);

  /**
   * Повертає номер поточної сторінки для твору.
   *
   * @param {number|string} workId - ID твору.
   * @returns {number} Номер поточної сторінки.
   */
  const getCurrentPage = (workId) => {
    return currentPagesByWork[String(workId)] || 0;
  };

  /**
   * Змінює сторінку перегляду твору в модерації.
   *
   * @param {number|string} workId - ID твору.
   * @param {number} pageIndex - Новий індекс сторінки.
   * @returns {void}
   */
  const setCurrentPageForWork = (workId, pageIndex) => {
    setCurrentPagesByWork((previousPages) => ({
      ...previousPages,
      [String(workId)]: pageIndex,
    }));
  };

  /**
   * Переходить на попередню сторінку твору.
   *
   * @param {Object} work - Твір, який перевіряється.
   * @returns {void}
   */
  const goToPreviousPage = (work) => {
    const currentPage = getCurrentPage(work.id);
    const previousPage = Math.max(currentPage - 1, 0);

    setCurrentPageForWork(work.id, previousPage);
  };

  /**
   * Переходить на наступну сторінку твору.
   *
   * @param {Object} work - Твір, який перевіряється.
   * @returns {void}
   */
  const goToNextPage = (work) => {
    const currentPage = getCurrentPage(work.id);
    const pagesCount = work.pages?.length || 0;
    const nextPage = Math.min(currentPage + 1, pagesCount - 1);

    setCurrentPageForWork(work.id, nextPage);
  };

  /**
   * Підтверджує твір через backend.
   *
   * @param {number|string} workId - ID твору.
   * @returns {Promise<void>}
   */
  const handleApproveWork = async (workId) => {
    try {
      setProcessingWorkId(workId);
      setPageError("");

      await approveWork(workId, token);

      setPendingWorks((works) =>
        works.filter((work) => String(work.id) !== String(workId)),
      );

      if (rejectingWorkId === workId) {
        setRejectingWorkId(null);
        setRejectionReason("");
        setRejectionError("");
      }
    } catch (error) {
      setPageError(
        error.message ||
          "Не вдалося підтвердити твір. Перевірте backend і права користувача.",
      );
    } finally {
      setProcessingWorkId(null);
    }
  };

  /**
   * Відкриває форму введення причини відхилення.
   *
   * @param {number|string} workId - ID твору.
   * @returns {void}
   */
  const startRejectingWork = (workId) => {
    setRejectingWorkId(workId);
    setRejectionReason("");
    setRejectionError("");
    setPageError("");
  };

  /**
   * Скасовує відхилення твору.
   *
   * @returns {void}
   */
  const cancelRejectingWork = () => {
    setRejectingWorkId(null);
    setRejectionReason("");
    setRejectionError("");
  };

  /**
   * Відхиляє твір через backend.
   *
   * @param {number|string} workId - ID твору.
   * @returns {Promise<void>}
   */
  const confirmRejectWork = async (workId) => {
    const normalizedReason = rejectionReason.trim();

    if (!normalizedReason) {
      setRejectionError("Вкажіть причину відхилення твору.");
      return;
    }

    try {
      setProcessingWorkId(workId);
      setPageError("");
      setRejectionError("");

      await rejectWork(workId, normalizedReason, token);

      setPendingWorks((works) =>
        works.filter((work) => String(work.id) !== String(workId)),
      );

      setRejectingWorkId(null);
      setRejectionReason("");
    } catch (error) {
      setPageError(
        error.message ||
          "Не вдалося відхилити твір. Перевірте backend і права користувача.",
      );
    } finally {
      setProcessingWorkId(null);
    }
  };

  if (!hasAccess && !isLoading) {
    return (
      <section className="admin">
        <div className="admin__card">
          <h1 className="admin__title">Модерація творів</h1>
          <p className="admin__subtitle">
            У вас немає доступу до цієї сторінки. Потрібна роль модератора або
            адміністратора.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="admin">
      <div className="admin__card">
        <h1 className="admin__title">Модерація творів</h1>
        <p className="admin__subtitle">
          Тут відображаються твори, які користувачі відправили на перевірку.
          Модератор може переглянути всі сторінки твору перед публікацією.
        </p>

        <div className="admin__counter">Очікують модерації: {pendingCount}</div>
      </div>

      {isLoading && (
        <div className="admin__empty">Завантажуємо твори на модерації...</div>
      )}

      {!isLoading && pageError && (
        <div className="admin__empty">{pageError}</div>
      )}

      {!isLoading && !pageError && pendingWorks.length === 0 ? (
        <div className="admin__empty">Немає творів, які очікують модерації.</div>
      ) : null}

      {!isLoading && pendingWorks.length > 0 && (
        <div className="admin__list">
          {pendingWorks.map((work) => {
            const pages = work.pages || [];
            const currentPage = getCurrentPage(work.id);
            const pageText = pages[currentPage] || "Текст твору відсутній.";
            const isRejecting = rejectingWorkId === work.id;
            const isProcessing = String(processingWorkId) === String(work.id);

            return (
              <article className="admin__work" key={work.id}>
                <img
                  className="admin__cover"
                  src={work.cover}
                  alt={work.title}
                />

                <div className="admin__content">
                  <div className="admin__work-header">
                    <div>
                      <h2 className="admin__work-title">{work.title}</h2>
                      <p className="admin__author">Автор: {work.author}</p>
                    </div>

                    <span className="admin__status">На модерації</span>
                  </div>

                  <p className="admin__meta">Жанр: {work.genre}</p>
                  <p className="admin__description">{work.description}</p>

                  <div className="admin__reader">
                    <div className="admin__reader-top">
                      <strong>Перегляд тексту</strong>

                      <span>
                        Сторінка {currentPage + 1} з {pages.length || 1}
                      </span>
                    </div>

                    <div className="admin__reader-page">
                      {renderParagraphs(pageText)}
                    </div>

                    {pages.length > 1 && (
                      <div className="admin__reader-controls">
                        <button
                          className="admin__reader-button"
                          type="button"
                          onClick={() => goToPreviousPage(work)}
                          disabled={currentPage === 0 || isProcessing}
                        >
                          Попередня
                        </button>

                        <button
                          className="admin__reader-button"
                          type="button"
                          onClick={() => goToNextPage(work)}
                          disabled={
                            currentPage === pages.length - 1 || isProcessing
                          }
                        >
                          Наступна
                        </button>
                      </div>
                    )}
                  </div>

                  {isRejecting && (
                    <div className="admin__reject-form">
                      <label className="admin__reject-label">
                        Причина відхилення
                        <textarea
                          className="admin__reject-textarea"
                          value={rejectionReason}
                          onChange={(event) => {
                            setRejectionReason(event.target.value);
                            setRejectionError("");
                          }}
                          placeholder="Наприклад: потрібно виправити оформлення, додати опис або доопрацювати текст."
                          rows="4"
                          disabled={isProcessing}
                        />
                      </label>

                      {rejectionError && (
                        <p className="admin__reject-error">
                          {rejectionError}
                        </p>
                      )}

                      <div className="admin__reject-actions">
                        <button
                          className="admin__button admin__button--reject"
                          type="button"
                          onClick={() => confirmRejectWork(work.id)}
                          disabled={isProcessing}
                        >
                          {isProcessing
                            ? "Відхиляємо..."
                            : "Підтвердити відхилення"}
                        </button>

                        <button
                          className="admin__button admin__button--secondary"
                          type="button"
                          onClick={cancelRejectingWork}
                          disabled={isProcessing}
                        >
                          Скасувати
                        </button>
                      </div>
                    </div>
                  )}

                  {!isRejecting && (
                    <div className="admin__actions">
                      <button
                        className="admin__button admin__button--approve"
                        type="button"
                        onClick={() => handleApproveWork(work.id)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? "Підтверджуємо..." : "Підтвердити"}
                      </button>

                      <button
                        className="admin__button admin__button--reject"
                        type="button"
                        onClick={() => startRejectingWork(work.id)}
                        disabled={isProcessing}
                      >
                        Відхилити
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}