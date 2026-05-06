import { useState } from "react";
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

/**
 * Перевіряє, чи містить текст надто довгі фрагменти без пробілів.
 *
 * Такі фрагменти зазвичай є посиланнями, base64-рядками або випадково
 * вставленими технічними даними, які можуть зламати верстку сторінки.
 *
 * @param {string} rawText - Текст твору.
 * @returns {boolean} true, якщо знайдено надто довге слово або посилання.
 */
function hasTooLongWords(rawText) {
  return rawText
    .split(/\s+/)
    .some((word) => word.length > MAX_WORD_LENGTH);
}

/**
 * Автоматично розбиває текст твору на сторінки.
 *
 * Текст спочатку ділиться за абзацами.
 * Якщо абзац занадто великий, він додатково ділиться на частини,
 * щоб одна довга частина тексту не потрапила на одну сторінку.
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
    } else if (textPart.length > PAGE_SIZE) {
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
    } else {
      currentPage = nextPage;
    }
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
 * Якщо автор використовує розділювач `---`, сторінки створюються вручну.
 * Якщо розділювача немає, текст автоматично ділиться на сторінки.
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
 * Сторінка створення нового твору користувачем.
 *
 * Після заповнення форми твір зберігається як такий,
 * що очікує перевірки модератором.
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

  /**
   * Обробляє відправку форми створення твору.
   *
   * @param {React.FormEvent<HTMLFormElement>} event - Подія submit.
   * @returns {void}
   */
  const handleSubmit = (event) => {
    event.preventDefault();

    if (hasTooLongWords(content)) {
      setError(
        "Текст містить надто довгий фрагмент без пробілів. Перевірте, чи не вставлено посилання або некоректний технічний текст у поле твору.",
      );
      return;
    }

    const pages = splitTextIntoPages(content);

    if (
      !title.trim()
      || !genre.trim()
      || !description.trim()
      || pages.length === 0
    ) {
      setError("Заповніть назву, жанр, опис і текст твору.");
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
      cover: cover.trim() || DEFAULT_COVER,
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
              Заповніть інформацію про твір. Після відправлення він потрапить
              на модерацію і буде опублікований тільки після підтвердження.
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
          </label>

          <label className="create-work__field">
            Текст твору
            <span className="create-work__hint">
              Вставте повний текст. Система автоматично розділить його на
              сторінки. Якщо хочете поділити вручну, поставте --- на окремому
              рядку між сторінками. Не вставляйте сюди посилання або технічні
              рядки.
            </span>

            <textarea
              className="create-work__textarea create-work__textarea--content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder={
                "Вставте текст твору тут.\n\nНовий абзац робіть через порожній рядок.\n\nДля ручного поділу сторінок поставте --- між частинами тексту."
              }
              rows="14"
            />
          </label>

          <div className="create-work__actions">
            <button className="create-work__submit" type="submit">
              Відправити на модерацію
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