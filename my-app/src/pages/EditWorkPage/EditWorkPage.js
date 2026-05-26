import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { renderFormattedParagraphs } from "../../utils/richText";
import { getWorkById, updateWork } from "../../api/worksApi";
import {
  MIN_CONTENT_LENGTH,
  hasTooLongWords,
  isValidCoverUrl,
  joinPagesForEditing,
  splitTextIntoPages,
} from "../../utils/textPagination";
import "./EditWorkPage.css";

/**
 * Сторінка редагування власного твору.
 *
 * Завантажує твір з backend, дозволяє змінити дані,
 * після збереження відправляє твір назад на модерацію.
 *
 * @returns {JSX.Element} Форма редагування твору.
 */
export default function EditWorkPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);

  const [work, setWork] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");
  const [cover, setCover] = useState("");
  const [content, setContent] = useState("");

  const [error, setError] = useState("");
  const [previewPage, setPreviewPage] = useState(0);

  const contentTextareaRef = useRef(null);
  const previewReaderRef = useRef(null);

  const scrollToPreviewReader = () => {
    setTimeout(() => {
      previewReaderRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  };

  const applyContentFormat = (marker) => {
    const textarea = contentTextareaRef.current;

    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.slice(start, end);
    const textToFormat = selectedText || "текст";
    const formattedText = `${marker}${textToFormat}${marker}`;

    const nextContent =
      content.slice(0, start) + formattedText + content.slice(end);

    setContent(nextContent);
    setPreviewPage(0);

    setTimeout(() => {
      textarea.focus();

      const selectionStart = start + marker.length;
      const selectionEnd = selectionStart + textToFormat.length;

      textarea.setSelectionRange(selectionStart, selectionEnd);
    }, 0);
  };

  const pages = useMemo(() => {
    return splitTextIntoPages(content);
  }, [content]);

  const contentLength = content.trim().length;
  const safePreviewPage = Math.min(previewPage, Math.max(pages.length - 1, 0));
  const previewPageText =
    pages[safePreviewPage] || "Текст твору поки не додано.";

  useEffect(() => {
    let isMounted = true;

    /**
     * Завантажує твір для редагування.
     *
     * @returns {Promise<void>}
     */
    const loadWork = async () => {
      try {
        setIsLoading(true);
        setError("");

        const workFromApi = await getWorkById(id);

        if (!isMounted) {
          return;
        }

        setWork(workFromApi);
        setTitle(workFromApi.title || "");
        setGenre(workFromApi.genre || "");
        setDescription(workFromApi.description || "");
        setCover(workFromApi.cover || "");
        setContent(
          workFromApi.pages ? joinPagesForEditing(workFromApi.pages) : "",
        );
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(
          loadError.message ||
            "Не вдалося завантажити твір для редагування.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadWork();

    return () => {
      isMounted = false;
    };
  }, [id]);

  /**
   * Переходить на попередню сторінку preview.
   *
   * @returns {void}
   */
  const goToPreviousPreviewPage = () => {
    setPreviewPage((page) => Math.max(page - 1, 0));
    scrollToPreviewReader();
  };

  /**
   * Переходить на наступну сторінку preview.
   *
   * @returns {void}
   */
  const goToNextPreviewPage = () => {
    setPreviewPage((page) => Math.min(page + 1, pages.length - 1));
    scrollToPreviewReader();
  };

  /**
   * Зберігає зміни твору через backend.
   *
   * @param {React.FormEvent<HTMLFormElement>} event - Подія submit.
   * @returns {Promise<void>}
   */
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      setError("Щоб редагувати твір, потрібно увійти в акаунт.");
      return;
    }

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

    try {
      setIsSubmitting(true);
      setError("");

      await updateWork(
        id,
        {
          title: title.trim(),
          genre: genre.trim(),
          description: description.trim(),
          cover: cover.trim(),
          pages,
        },
        token,
      );

      navigate("/cabinet");
    } catch (submitError) {
      setError(
        submitError.message ||
          "Не вдалося зберегти зміни. Перевірте backend і спробуйте ще раз.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <section className="edit-work">
        <div className="edit-work__card">
          <h1 className="edit-work__title">Завантаження твору...</h1>
        </div>
      </section>
    );
  }

  if (!work) {
    return (
      <section className="edit-work">
        <div className="edit-work__card">
          <h1 className="edit-work__title">Твір не знайдено</h1>

          {error && <p className="edit-work__error">{error}</p>}

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

  return (
    <section className="edit-work">
      <div className="edit-work__card">
        <div className="edit-work__header">
          <h1 className="edit-work__title">Редагувати твір</h1>

          <p className="edit-work__subtitle">
            Після збереження змін твір знову буде відправлений на модерацію.
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
              disabled={isSubmitting}
            />
          </label>

          <label className="edit-work__field">
            Жанр
            <input
              className="edit-work__input"
              value={genre}
              onChange={(event) => setGenre(event.target.value)}
              disabled={isSubmitting}
            />
          </label>

          <label className="edit-work__field">
            Короткий опис
            <textarea
              className="edit-work__textarea"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows="4"
              disabled={isSubmitting}
            />
          </label>

          <label className="edit-work__field">
            Посилання на обкладинку
            <input
              className="edit-work__input"
              value={cover}
              onChange={(event) => setCover(event.target.value)}
              disabled={isSubmitting}
            />
          </label>

          <label className="edit-work__field">
            Текст твору
            <span className="edit-work__hint">
              Сторінки розділені символами ---. Ви можете змінити текст або
              додати нові сторінки.
            </span>

            <div className="edit-work__format-toolbar">
              <button
                className="edit-work__format-button"
                type="button"
                onClick={() => applyContentFormat("**")}
                disabled={isSubmitting}
              >
                <strong>Жирний</strong>
              </button>

              <button
                className="edit-work__format-button"
                type="button"
                onClick={() => applyContentFormat("*")}
                disabled={isSubmitting}
              >
                <em>Курсив</em>
              </button>
            </div>

            <textarea
              ref={contentTextareaRef}
              className="edit-work__textarea edit-work__textarea--content"
              value={content}
              onChange={(event) => {
                setContent(event.target.value);
                setPreviewPage(0);
              }}
              rows="14"
              disabled={isSubmitting}
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
              <span>Після збереження</span>
              <strong>На модерації</strong>
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

            <div className="edit-work__preview-reader" ref={previewReaderRef}>
              <div className="edit-work__preview-reader-header">
                <h3>Перегляд сторінки</h3>

                <span>
                  {pages.length > 0
                    ? `${safePreviewPage + 1} / ${pages.length}`
                    : "0 / 0"}
                </span>
              </div>

              <div className="edit-work__preview-page">
                {renderFormattedParagraphs(previewPageText)}
              </div>

              {pages.length > 1 && (
                <div className="edit-work__preview-controls">
                  <button
                    className="edit-work__preview-button"
                    type="button"
                    onClick={goToPreviousPreviewPage}
                    disabled={safePreviewPage === 0 || isSubmitting}
                  >
                    Попередня
                  </button>

                  <button
                    className="edit-work__preview-button"
                    type="button"
                    onClick={goToNextPreviewPage}
                    disabled={
                      safePreviewPage === pages.length - 1 || isSubmitting
                    }
                  >
                    Наступна
                  </button>
                </div>
              )}
            </div>
          </section>

          <div className="edit-work__actions">
            <button
              className="edit-work__submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Зберігаємо..." : "Зберегти зміни"}
            </button>

            <button
              className="edit-work__cancel"
              type="button"
              onClick={() => navigate("/cabinet")}
              disabled={isSubmitting}
            >
              Скасувати
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}