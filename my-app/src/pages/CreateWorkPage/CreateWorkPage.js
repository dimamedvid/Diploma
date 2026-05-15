import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  PENDING_WORKS_STORAGE_KEY,
  getUserFullName,
  getUserId,
  readFromStorage,
  writeToStorage,
} from "../../utils/worksStorage";
import "./CreateWorkPage.css";

const DEFAULT_COVER =
  "https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg";

const PAGE_SIZE = 3500;
const MAX_WORD_LENGTH = 120;
const MIN_CONTENT_LENGTH = 300;

/**
 * Перевіряє, чи містить текст надто довгі фрагменти без пробілів.
 *
 * @param {string} rawText - Текст твору.
 * @returns {boolean} true, якщо знайдено надто довгий фрагмент.
 */
function hasTooLongWords(rawText) {
  return rawText
    .split(/\s+/)
    .some((word) => word.length > MAX_WORD_LENGTH);
}

/**
 * Перевіряє, чи є посилання коректним URL для обкладинки.
 *
 * @param {string} url - Посилання на обкладинку.
 * @returns {boolean} true, якщо URL порожній або починається з http/https.
 */
function isValidCoverUrl(url) {
  const normalizedUrl = url.trim();

  if (!normalizedUrl) {
    return true;
  }

  return (
    normalizedUrl.startsWith("http://") ||
    normalizedUrl.startsWith("https://")
  );
}

/**
 * Автоматично розбиває текст твору на сторінки.
 *
 * @param {string} rawText - Повний текст твору.
 * @returns {string[]} Масив сторінок твору.
 */
function splitTextAutomatically(rawText) {
  const paragraphs = rawText
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const pages = [];
  let currentPage = "";

  /**
   * Додає частину тексту до поточної сторінки або створює нову.
   *
   * @param {string} textPart - Частина тексту.
   * @returns {void}
   */
  const addTextPart = (textPart) => {
    const nextPage = currentPage
      ? `${currentPage}\n\n${textPart}`
      : textPart;

    if (nextPage.length > PAGE_SIZE && currentPage) {
      pages.push(currentPage);
      currentPage = textPart;
      return;
    }

    if (textPart.length > PAGE_SIZE) {
      const words = textPart.split(/\s+/);
      let chunk = "";

      words.forEach((word) => {
        const nextChunk = chunk ? `${chunk} ${word}` : word;

        if (nextChunk.length > PAGE_SIZE && chunk) {
          pages.push(chunk);
          chunk = word;
        } else {
          chunk = nextChunk;
        }
      });

      currentPage = chunk;
      return;
    }

    currentPage = nextPage;
  };

  paragraphs.forEach((paragraph) => {
    addTextPart(paragraph);
  });

  if (currentPage) {
    pages.push(currentPage);
  }

  return pages;
}

/**
 * Розбиває текст твору на сторінки.
 *
 * @param {string} rawText - Повний текст із поля введення.
 * @returns {string[]} Масив сторінок твору.
 */
function splitTextIntoPages(rawText) {
  if (rawText.includes("---")) {
    return rawText
      .split("---")
      .map((page) => page.trim())
      .filter(Boolean);
  }

  return splitTextAutomatically(rawText);
}

/**
 * Розбиває текст сторінки на абзаци для попереднього перегляду.
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
 * Сторінка створення нового твору користувачем.
 *
 * @returns {JSX.Element} Форма додавання нового твору.
 */
export default function CreateWorkPage() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");
  const [cover, setCover] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [previewPage, setPreviewPage] = useState(0);

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
  };

  /**
   * Переходить на наступну сторінку попереднього перегляду.
   *
   * @returns {void}
   */
  const goToNextPreviewPage = () => {
    setPreviewPage((page) => Math.min(page + 1, pages.length - 1));
  };

  /**
   * Обробляє відправку форми створення твору.
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
        "Текст містить надто довгий фрагмент без пробілів. Перевірте, чи не вставлено посилання або технічний текст у поле твору.",
      );
      return;
    }

    if (pages.length === 0) {
      setError("Додайте текст твору.");
      return;
    }

    const pendingWorks = readFromStorage(PENDING_WORKS_STORAGE_KEY, []);

    const newWork = {
      id: Date.now(),
      title: title.trim(),
      author: getUserFullName(user),
      authorId: getUserId(user),
      genre: genre.trim(),
      rating: 0,
      description: description.trim(),
      cover: previewCover,
      pages,
      status: "pending",
      submittedAt: new Date().toLocaleDateString("uk-UA"),
    };

    writeToStorage(PENDING_WORKS_STORAGE_KEY, [...pendingWorks, newWork]);
    navigate("/cabinet");
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
            />
          </label>

          <label className="create-work__field">
            Жанр
            <input
              className="create-work__input"
              value={genre}
              onChange={(event) => setGenre(event.target.value)}
              placeholder="Наприклад: Поезія, Повість, Драма"
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
            />
          </label>

          <label className="create-work__field">
            Посилання на обкладинку
            <input
              className="create-work__input"
              value={cover}
              onChange={(event) => setCover(event.target.value)}
              placeholder="https://..."
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

            <textarea
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
                  {getUserFullName(user)}
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

            <div className="create-work__preview-reader">
              <div className="create-work__preview-reader-header">
                <h3>Перегляд сторінки</h3>

                <span>
                  {pages.length > 0
                    ? `${safePreviewPage + 1} / ${pages.length}`
                    : "0 / 0"}
                </span>
              </div>

              <div className="create-work__preview-page">
                {renderParagraphs(previewPageText)}
              </div>

              {pages.length > 1 && (
                <div className="create-work__preview-controls">
                  <button
                    className="create-work__preview-button"
                    type="button"
                    onClick={goToPreviousPreviewPage}
                    disabled={safePreviewPage === 0}
                  >
                    Попередня
                  </button>

                  <button
                    className="create-work__preview-button"
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

          <div className="create-work__actions">
            <button className="create-work__submit" type="submit">
              Відправити на модерацію
            </button>

            <button
              className="create-work__clear"
              type="button"
              onClick={clearForm}
            >
              Очистити форму
            </button>

            <button
              className="create-work__cancel"
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