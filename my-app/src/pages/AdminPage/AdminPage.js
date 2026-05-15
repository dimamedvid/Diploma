import { useMemo, useState } from "react";
import {
  APPROVED_WORKS_STORAGE_KEY,
  PENDING_WORKS_STORAGE_KEY,
  REJECTED_WORKS_STORAGE_KEY,
  readFromStorage,
  writeToStorage,
} from "../../utils/worksStorage";
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
  const [pendingWorks, setPendingWorks] = useState(() =>
    readFromStorage(PENDING_WORKS_STORAGE_KEY, []),
  );

  const [approvedWorks, setApprovedWorks] = useState(() =>
    readFromStorage(APPROVED_WORKS_STORAGE_KEY, []),
  );

  const [rejectedWorks, setRejectedWorks] = useState(() =>
    readFromStorage(REJECTED_WORKS_STORAGE_KEY, []),
  );

  const [currentPagesByWork, setCurrentPagesByWork] = useState({});

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
    const workToApprove = pendingWorks.find((work) => work.id === workId);

    if (!workToApprove) {
      return;
    }

    const approvedWork = {
      ...workToApprove,
      status: "approved",
      approvedAt: new Date().toLocaleDateString("uk-UA"),
      rejectedAt: "",
      rejectionReason: "",
    };

    const updatedPendingWorks = pendingWorks.filter(
      (work) => work.id !== workId,
    );

    const updatedApprovedWorks = [...approvedWorks, approvedWork];

    setPendingWorks(updatedPendingWorks);
    setApprovedWorks(updatedApprovedWorks);

    writeToStorage(PENDING_WORKS_STORAGE_KEY, updatedPendingWorks);
    writeToStorage(APPROVED_WORKS_STORAGE_KEY, updatedApprovedWorks);
  };

  /**
   * Відхиляє твір, зберігає причину відхилення і переносить його в історію.
   *
   * @param {number|string} workId - ID твору.
   * @returns {void}
   */
  const rejectWork = (workId) => {
    const workToReject = pendingWorks.find((work) => work.id === workId);

    if (!workToReject) {
      return;
    }

    const reason = window.prompt(
      "Вкажіть причину відхилення твору:",
      "Потрібно доопрацювати зміст або оформлення твору.",
    );

    if (reason === null) {
      return;
    }

    const rejectedWork = {
      ...workToReject,
      status: "rejected",
      rejectedAt: new Date().toLocaleDateString("uk-UA"),
      rejectionReason: reason.trim() || "Причину не вказано.",
    };

    const updatedPendingWorks = pendingWorks.filter(
      (work) => work.id !== workId,
    );

    const updatedRejectedWorks = [...rejectedWorks, rejectedWork];

    setPendingWorks(updatedPendingWorks);
    setRejectedWorks(updatedRejectedWorks);

    writeToStorage(PENDING_WORKS_STORAGE_KEY, updatedPendingWorks);
    writeToStorage(REJECTED_WORKS_STORAGE_KEY, updatedRejectedWorks);
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
                      onClick={() => rejectWork(work.id)}
                    >
                      Відхилити
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}