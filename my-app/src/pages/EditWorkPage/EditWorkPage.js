import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  APPROVED_WORKS_STORAGE_KEY,
  PENDING_WORKS_STORAGE_KEY,
  REJECTED_WORKS_STORAGE_KEY,
  getUserId,
  readFromStorage,
  writeToStorage,
} from "../../utils/worksStorage";
import {
  MIN_CONTENT_LENGTH,
  hasTooLongWords,
  isValidCoverUrl,
  joinPagesForEditing,
  splitTextIntoPages,
} from "../../utils/textPagination";
import "./EditWorkPage.css";

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
 * Шукає твір серед творів на модерації, опублікованих і відхилених.
 *
 * @param {number|string} workId - ID твору.
 * @param {Object[]} pendingWorks - Твори на модерації.
 * @param {Object[]} approvedWorks - Опубліковані твори.
 * @param {Object[]} rejectedWorks - Відхилені твори.
 * @returns {{ work: Object|null, source: string }} Знайдений твір і джерело.
 */
function findUserWork(workId, pendingWorks, approvedWorks, rejectedWorks) {
  const pendingWork = pendingWorks.find(
    (work) => String(work.id) === String(workId),
  );

  if (pendingWork) {
    return {
      work: pendingWork,
      source: "pending",
    };
  }

  const approvedWork = approvedWorks.find(
    (work) => String(work.id) === String(workId),
  );

  if (approvedWork) {
    return {
      work: approvedWork,
      source: "approved",
    };
  }

  const rejectedWork = rejectedWorks.find(
    (work) => String(work.id) === String(workId),
  );

  if (rejectedWork) {
    return {
      work: rejectedWork,
      source: "rejected",
    };
  }

  return {
    work: null,
    source: "",
  };
}

/**
 * Сторінка редагування власного твору.
 *
 * Якщо редагується опублікований або відхилений твір,
 * після збереження він знову потрапляє на модерацію.
 *
 * @returns {JSX.Element} Форма редагування твору.
 */
export default function EditWorkPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const userId = getUserId(user);

  const pendingWorks = useMemo(() => {
    return readFromStorage(PENDING_WORKS_STORAGE_KEY, []);
  }, []);

  const approvedWorks = useMemo(() => {
    return readFromStorage(APPROVED_WORKS_STORAGE_KEY, []);
  }, []);

  const rejectedWorks = useMemo(() => {
    return readFromStorage(REJECTED_WORKS_STORAGE_KEY, []);
  }, []);

  const { work, source } = useMemo(() => {
    return findUserWork(id, pendingWorks, approvedWorks, rejectedWorks);
  }, [id, pendingWorks, approvedWorks, rejectedWorks]);

  const [title, setTitle] = useState(work?.title || "");
  const [genre, setGenre] = useState(work?.genre || "");
  const [description, setDescription] = useState(work?.description || "");
  const [cover, setCover] = useState(work?.cover || "");
  const [content, setContent] = useState(
    work?.pages ? joinPagesForEditing(work.pages) : "",
  );
  const [error, setError] = useState("");
  const [previewPage, setPreviewPage] = useState(0);

  const pages = useMemo(() => {
    return splitTextIntoPages(content);
  }, [content]);

  const contentLength = content.trim().length;
  const safePreviewPage = Math.min(previewPage, Math.max(pages.length - 1, 0));
  const previewPageText =
    pages[safePreviewPage] || "Текст твору поки не додано.";
  const isOwner = work?.authorId === userId;

  if (!work || !isOwner) {
    return (
      <section className="edit-work">
        <div className="edit-work__card">
          <h1 className="edit-work__title">Твір не знайдено</h1>
          <p className="edit-work__subtitle">
            Ви не можете редагувати цей твір або він більше не існує.
          </p>

          <button
            className="edit-work__cancel"
            type="button"
            onClick={() => navigate("/cabinet")}
          >
            Повернутися в кабінет
          </button>
        </div>
      </section>
    );
  }

  /**
   * Переходить на попередню сторінку preview.
   *
   * @returns {void}
   */
  const goToPreviousPreviewPage = () => {
    setPreviewPage((page) => Math.max(page - 1, 0));
  };

  /**
   * Переходить на наступну сторінку preview.
   *
   * @returns {void}
   */
  const goToNextPreviewPage = () => {
    setPreviewPage((page) => Math.min(page + 1, pages.length - 1));
  };

  /**
   * Зберігає зміни твору.
   *
   * @param {React.FormEvent<HTMLFormElement>} event - Подія submit.
   * @returns {void}
   */
  const handleSubmit = (event) => {
    event.preventDefault();

    if (!title.trim() || !genre.trim() || !description.trim()) {
      setError("Заповніть назву, жанр і короткий опис твору.");
      return;
    }

    if (contentLength < MIN_CONTENT_LENGTH) {
      setError(
        `Текст твору має містити щонайменше ${MIN_CONTENT_LENGTH} символів.`,
      );
      return;
    }

    if (!isValidCoverUrl(cover)) {
      setError("Посилання на обкладинку має починатися з http:// або https://.");
      return;
    }

    if (hasTooLongWords(content)) {
      setError(
        "Текст містить надто довгий фрагмент без пробілів. Перевірте текст твору.",
      );
      return;
    }

    if (pages.length === 0) {
      setError("Додайте текст твору.");
      return;
    }

    const updatedWork = {
      ...work,
      title: title.trim(),
      genre: genre.trim(),
      description: description.trim(),
      cover: cover.trim(),
      pages,
      status: "pending",
      updatedAt: new Date().toLocaleDateString("uk-UA"),
      rejectedAt: "",
      rejectionReason: "",
    };

    if (source === "pending") {
      const updatedPendingWorks = pendingWorks.map((pendingWork) =>
        pendingWork.id === work.id ? updatedWork : pendingWork,
      );

      writeToStorage(PENDING_WORKS_STORAGE_KEY, updatedPendingWorks);
      navigate("/cabinet");
      return;
    }

    if (source === "rejected") {
      const updatedRejectedWorks = rejectedWorks.filter(
        (rejectedWork) => rejectedWork.id !== work.id,
      );

      const updatedPendingWorks = [
        ...pendingWorks,
        {
          ...updatedWork,
          submittedAt: new Date().toLocaleDateString("uk-UA"),
        },
      ];

      writeToStorage(REJECTED_WORKS_STORAGE_KEY, updatedRejectedWorks);
      writeToStorage(PENDING_WORKS_STORAGE_KEY, updatedPendingWorks);

      navigate("/cabinet");
      return;
    }

    const updatedApprovedWorks = approvedWorks.filter(
      (approvedWork) => approvedWork.id !== work.id,
    );

    const updatedPendingWorks = [
      ...pendingWorks,
      {
        ...updatedWork,
        submittedAt: new Date().toLocaleDateString("uk-UA"),
      },
    ];

    writeToStorage(APPROVED_WORKS_STORAGE_KEY, updatedApprovedWorks);
    writeToStorage(PENDING_WORKS_STORAGE_KEY, updatedPendingWorks);

    navigate("/cabinet");
  };

  return (
    <section className="edit-work">
      <div className="edit-work__card">
        <div className="edit-work__header">
          <h1 className="edit-work__title">Редагувати твір</h1>

          <p className="edit-work__subtitle">
            Після редагування опублікованого або відхиленого твору він знову
            буде відправлений на модерацію.
          </p>
        </div>

        <form className="edit-work__form" onSubmit={handleSubmit}>
          {error && <p className="edit-work__error">{error}</p>}

          <label className="edit-work__field">
            Назва твору
            <input
              className="edit-work__input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>

          <label className="edit-work__field">
            Жанр
            <input
              className="edit-work__input"
              value={genre}
              onChange={(event) => setGenre(event.target.value)}
            />
          </label>

          <label className="edit-work__field">
            Короткий опис
            <textarea
              className="edit-work__textarea"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows="4"
            />
          </label>

          <label className="edit-work__field">
            Посилання на обкладинку
            <input
              className="edit-work__input"
              value={cover}
              onChange={(event) => setCover(event.target.value)}
            />
          </label>

          <label className="edit-work__field">
            Текст твору
            <span className="edit-work__hint">
              Сторінки розділені символами ---. Ви можете змінити текст або
              додати нові сторінки.
            </span>

            <textarea
              className="edit-work__textarea edit-work__textarea--content"
              value={content}
              onChange={(event) => {
                setContent(event.target.value);
                setPreviewPage(0);
              }}
              rows="14"
            />
          </label>

          <div className="edit-work__stats">
            <div className="edit-work__stat">
              <span>Символів у тексті</span>
              <strong>{contentLength}</strong>
            </div>

            <div className="edit-work__stat">
              <span>Сторінок після збереження</span>
              <strong>{pages.length}</strong>
            </div>

            <div className="edit-work__stat">
              <span>Поточний статус</span>
              <strong>{source}</strong>
            </div>
          </div>

          <section className="edit-work__preview">
            <div className="edit-work__preview-header">
              <h2 className="edit-work__preview-title">
                Попередній перегляд
              </h2>

              <span className="edit-work__preview-pages">
                Сторінка {pages.length > 0 ? safePreviewPage + 1 : 0} з{" "}
                {pages.length}
              </span>
            </div>

            <div className="edit-work__preview-card">
              <img
                className="edit-work__preview-cover"
                src={cover}
                alt={title || "Обкладинка твору"}
              />

              <div className="edit-work__preview-info">
                <h3>{title || "Назва твору"}</h3>

                <div className="edit-work__preview-meta">
                  <span>{genre || "Жанр"}</span>
                  <span>Після збереження: на модерації</span>
                </div>

                <p className="edit-work__preview-description">
                  {description || "Короткий опис твору буде показано тут."}
                </p>
              </div>
            </div>

            <div className="edit-work__preview-reader">
              <div className="edit-work__preview-reader-header">
                <h3>Перегляд сторінки</h3>

                <span>
                  {pages.length > 0
                    ? `${safePreviewPage + 1} / ${pages.length}`
                    : "0 / 0"}
                </span>
              </div>

              <div className="edit-work__preview-page">
                {renderParagraphs(previewPageText)}
              </div>

              {pages.length > 1 && (
                <div className="edit-work__preview-controls">
                  <button
                    className="edit-work__preview-button"
                    type="button"
                    onClick={goToPreviousPreviewPage}
                    disabled={safePreviewPage === 0}
                  >
                    Попередня
                  </button>

                  <button
                    className="edit-work__preview-button"
                    type="button"
                    onClick={goToNextPreviewPage}
                    disabled={safePreviewPage === pages.length - 1}
                  >
                    Наступна
                  </button>
                </div>
              )}
            </div>
          </section>

          <div className="edit-work__actions">
            <button className="edit-work__submit" type="submit">
              Зберегти зміни
            </button>

            <button
              className="edit-work__cancel"
              type="button"
              onClick={() => navigate("/cabinet")}
            >
              Скасувати
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}