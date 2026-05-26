import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { createWork } from "../../api/worksApi";
import { renderFormattedParagraphs } from "../../utils/richText";
import { getUserFullName } from "../../utils/worksStorage";
import {
  MIN_CONTENT_LENGTH,
  hasTooLongWords,
  isValidCoverUrl,
  splitTextIntoPages,
} from "../../utils/textPagination";
import "./CreateWorkPage.css";

const DEFAULT_COVER =
  "https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg";

/**
 * Сторінка створення нового твору користувачем.
 *
 * Дозволяє заповнити інформацію про твір, переглянути попередній результат,
 * побачити кількість символів і сторінок, а потім відправити твір на backend.
 *
 * @returns {JSX.Element} Форма додавання нового твору.
 */
export default function CreateWorkPage() {
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);

  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");
  const [cover, setCover] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [previewPage, setPreviewPage] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const previewCover = cover.trim() || DEFAULT_COVER;
  const safePreviewPage = Math.min(previewPage, Math.max(pages.length - 1, 0));
  const previewPageText =
    pages[safePreviewPage] || "Текст твору поки не додано.";

  /**
   * Очищає всі поля форми.
   *
   * @returns {void}
   */
  const clearForm = () => {
    const shouldClear = window.confirm("Очистити всі поля форми?");

    if (!shouldClear) {
      return;
    }

    setTitle("");
    setGenre("");
    setDescription("");
    setCover("");
    setContent("");
    setError("");
    setPreviewPage(0);
  };

  /**
   * Переходить на попередню сторінку попереднього перегляду.
   *
   * @returns {void}
   */
  const goToPreviousPreviewPage = () => {
    setPreviewPage((page) => Math.max(page - 1, 0));
    scrollToPreviewReader();
  };

  /**
   * Переходить на наступну сторінку попереднього перегляду.
   *
   * @returns {void}
   */
  const goToNextPreviewPage = () => {
    setPreviewPage((page) => Math.min(page + 1, pages.length - 1));
    scrollToPreviewReader();
  };

  /**
   * Обробляє відправку форми створення твору.
   *
   * @param {React.FormEvent<HTMLFormElement>} event - Подія submit.
   * @returns {Promise<void>}
   */
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      setError("Щоб додати твір, потрібно увійти в акаунт.");
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
        "Текст містить надто довгий фрагмент без пробілів. Перевірте, чи не вставлено посилання або технічний текст у поле твору.",
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

      await createWork(
        {
          title: title.trim(),
          genre: genre.trim(),
          description: description.trim(),
          cover: previewCover,
          pages,
        },
        token,
      );

      navigate("/cabinet");
    } catch (submitError) {
      setError(
        submitError.message ||
          "Не вдалося відправити твір на модерацію. Перевірте backend і спробуйте ще раз.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="create-work">
      <div className="create-work__card">
        <div className="create-work__header">
          <div>
            <h1 className="create-work__title">Додати твір</h1>
            <p className="create-work__subtitle">
              Заповніть інформацію про твір. Перед відправленням можна
              переглянути, як він виглядатиме після публікації.
            </p>
          </div>
        </div>

        <form className="create-work__form" onSubmit={handleSubmit}>
          {error && <p className="create-work__error">{error}</p>}

          <label className="create-work__field">
            Назва твору
            <input
              className="create-work__input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Наприклад: Мій перший твір"
              disabled={isSubmitting}
            />
          </label>

          <label className="create-work__field">
            Жанр
            <input
              className="create-work__input"
              value={genre}
              onChange={(event) => setGenre(event.target.value)}
              placeholder="Наприклад: Поезія, Повість, Драма"
              disabled={isSubmitting}
            />
          </label>

          <label className="create-work__field">
            Короткий опис
            <textarea
              className="create-work__textarea"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Коротко опишіть твір"
              rows="4"
              disabled={isSubmitting}
            />
          </label>

          <label className="create-work__field">
            Посилання на обкладинку
            <input
              className="create-work__input"
              value={cover}
              onChange={(event) => setCover(event.target.value)}
              placeholder="https://..."
              disabled={isSubmitting}
            />

            <span className="create-work__hint">
              Якщо залишити поле порожнім, буде використано стандартну
              обкладинку.
            </span>
          </label>

          <label className="create-work__field">
            Текст твору
            <span className="create-work__hint">
              Вставте повний текст. Система автоматично розділить його на
              сторінки. Якщо хочете поділити вручну, поставте --- на окремому
              рядку між сторінками.
            </span>

            <div className="create-work__format-toolbar">
              <button
                className="create-work__format-button"
                type="button"
                onClick={() => applyContentFormat("**")}
                disabled={isSubmitting}
              >
                <strong>Жирний</strong>
              </button>

              <button
                className="create-work__format-button"
                type="button"
                onClick={() => applyContentFormat("*")}
                disabled={isSubmitting}
              >
                <em>Курсив</em>
              </button>
            </div>

            <textarea
              ref={contentTextareaRef}
              className="create-work__textarea create-work__textarea--content"
              value={content}
              onChange={(event) => {
                setContent(event.target.value);
                setPreviewPage(0);
              }}
              placeholder={
                "Вставте текст твору тут.\n\nНовий абзац робіть через порожній рядок.\n\nДля ручного поділу сторінок поставте --- між частинами тексту."
              }
              rows="14"
              disabled={isSubmitting}
            />
          </label>

          <div className="create-work__stats">
            <div className="create-work__stat">
              <span>Символів у тексті</span>
              <strong>{contentLength}</strong>
            </div>

            <div className="create-work__stat">
              <span>Буде створено сторінок</span>
              <strong>{pages.length}</strong>
            </div>

            <div className="create-work__stat">
              <span>Мінімальна довжина</span>
              <strong>{MIN_CONTENT_LENGTH}</strong>
            </div>
          </div>

          <section className="create-work__preview">
            <div className="create-work__preview-header">
              <h2 className="create-work__preview-title">
                Попередній перегляд
              </h2>

              <span className="create-work__preview-pages">
                Сторінка {pages.length > 0 ? safePreviewPage + 1 : 0} з{" "}
                {pages.length}
              </span>
            </div>

            <div className="create-work__preview-card">
              <img
                className="create-work__preview-cover"
                src={previewCover}
                alt={title || "Обкладинка твору"}
              />

              <div className="create-work__preview-info">
                <h3>{title || "Назва твору"}</h3>
                <p className="create-work__preview-author">
                  {user ? getUserFullName(user) : "Автор"}
                </p>

                <div className="create-work__preview-meta">
                  <span>{genre || "Жанр"}</span>
                  <span>На модерації</span>
                </div>

                <p className="create-work__preview-description">
                  {description || "Короткий опис твору буде показано тут."}
                </p>
              </div>
            </div>

            <div className="create-work__preview-reader" ref={previewReaderRef}>
              <div className="create-work__preview-reader-header">
                <h3>Перегляд сторінки</h3>

                <span>
                  {pages.length > 0
                    ? `${safePreviewPage + 1} / ${pages.length}`
                    : "0 / 0"}
                </span>
              </div>

              <div className="create-work__preview-page">
                {renderFormattedParagraphs(previewPageText)}
              </div>

              {pages.length > 1 && (
                <div className="create-work__preview-controls">
                  <button
                    className="create-work__preview-button"
                    type="button"
                    onClick={goToPreviousPreviewPage}
                    disabled={safePreviewPage === 0 || isSubmitting}
                  >
                    Попередня
                  </button>

                  <button
                    className="create-work__preview-button"
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

          <div className="create-work__actions">
            <button
              className="create-work__submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Відправляємо..." : "Відправити на модерацію"}
            </button>

            <button
              className="create-work__clear"
              type="button"
              onClick={clearForm}
              disabled={isSubmitting}
            >
              Очистити форму
            </button>

            <button
              className="create-work__cancel"
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