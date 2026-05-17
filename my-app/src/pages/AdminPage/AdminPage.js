import { useMemo, useState } from "react";
import {
  approveWorkById,
  getApprovedWorks,
  getPendingWorks,
  getRejectedWorks,
  rejectWorkById,
  saveApprovedWorks,
  savePendingWorks,
  saveRejectedWorks,
} from "../../utils/moderationStorage";
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
 * Сторінка модерації користувацьких творів.
 *
 * Дозволяє переглядати всі сторінки твору,
 * підтверджувати публікацію або відхиляти твір із причиною.
 *
 * @returns {JSX.Element} Сторінка адміністратора/модератора.
 */
export default function AdminPage() {
  const [pendingWorks, setPendingWorks] = useState(() => getPendingWorks());
  const [approvedWorks, setApprovedWorks] = useState(() => getApprovedWorks());
  const [rejectedWorks, setRejectedWorks] = useState(() => getRejectedWorks());

  const [currentPagesByWork, setCurrentPagesByWork] = useState({});
  const [rejectingWorkId, setRejectingWorkId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionError, setRejectionError] = useState("");

  const pendingCount = useMemo(() => pendingWorks.length, [pendingWorks]);

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
      [workId]: pageIndex,
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
   * Підтверджує твір і переносить його до опублікованих.
   *
   * @param {number|string} workId - ID твору.
   * @returns {void}
   */
  const approveWork = (workId) => {
    const { updatedPendingWorks, updatedApprovedWorks } = approveWorkById(
      pendingWorks,
      approvedWorks,
      workId,
    );

    setPendingWorks(updatedPendingWorks);
    setApprovedWorks(updatedApprovedWorks);

    savePendingWorks(updatedPendingWorks);
    saveApprovedWorks(updatedApprovedWorks);

    if (rejectingWorkId === workId) {
      setRejectingWorkId(null);
      setRejectionReason("");
      setRejectionError("");
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
   * Відхиляє твір, зберігає причину відхилення і переносить його в історію.
   *
   * @param {number|string} workId - ID твору.
   * @returns {void}
   */
  const confirmRejectWork = (workId) => {
    const normalizedReason = rejectionReason.trim();

    if (!normalizedReason) {
      setRejectionError("Вкажіть причину відхилення твору.");
      return;
    }

    const { updatedPendingWorks, updatedRejectedWorks } = rejectWorkById(
      pendingWorks,
      rejectedWorks,
      workId,
      normalizedReason,
    );

    setPendingWorks(updatedPendingWorks);
    setRejectedWorks(updatedRejectedWorks);

    savePendingWorks(updatedPendingWorks);
    saveRejectedWorks(updatedRejectedWorks);

    setRejectingWorkId(null);
    setRejectionReason("");
    setRejectionError("");
  };

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

      {pendingWorks.length === 0 ? (
        <div className="admin__empty">Немає творів, які очікують модерації.</div>
      ) : (
        <div className="admin__list">
          {pendingWorks.map((work) => {
            const pages = work.pages || [];
            const currentPage = getCurrentPage(work.id);
            const pageText = pages[currentPage] || "Текст твору відсутній.";
            const isRejecting = rejectingWorkId === work.id;

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
                          disabled={currentPage === 0}
                        >
                          Попередня
                        </button>

                        <button
                          className="admin__reader-button"
                          type="button"
                          onClick={() => goToNextPage(work)}
                          disabled={currentPage === pages.length - 1}
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
                        >
                          Підтвердити відхилення
                        </button>

                        <button
                          className="admin__button admin__button--secondary"
                          type="button"
                          onClick={cancelRejectingWork}
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
                        onClick={() => approveWork(work.id)}
                      >
                        Підтвердити
                      </button>

                      <button
                        className="admin__button admin__button--reject"
                        type="button"
                        onClick={() => startRejectingWork(work.id)}
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