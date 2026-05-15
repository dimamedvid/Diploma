import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  APPROVED_WORKS_STORAGE_KEY,
  PENDING_WORKS_STORAGE_KEY,
  getUserId,
  readFromStorage,
  writeToStorage,
} from "../../utils/worksStorage";
import "./EditWorkPage.css";

const PAGE_SIZE = 3500;
const MAX_WORD_LENGTH = 120;

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
   * Додає частину тексту до сторінки.
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
 * @param {string} rawText - Повний текст твору.
 * @returns {string[]} Масив сторінок.
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
 * Об'єднує сторінки твору в один текст для редагування.
 *
 * @param {string[]} pages - Сторінки твору.
 * @returns {string} Повний текст твору.
 */
function joinPagesForEditing(pages) {
  return pages.join("\n\n---\n\n");
}

/**
 * Шукає твір серед творів на модерації та опублікованих творів.
 *
 * @param {number|string} workId - ID твору.
 * @param {Object[]} pendingWorks - Твори на модерації.
 * @param {Object[]} approvedWorks - Опубліковані твори.
 * @returns {{ work: Object|null, source: string }} Знайдений твір і джерело.
 */
function findUserWork(workId, pendingWorks, approvedWorks) {
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

  return {
    work: null,
    source: "",
  };
}

/**
 * Сторінка редагування власного твору.
 *
 * Якщо редагується опублікований твір, після збереження він знову
 * потрапляє на модерацію.
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

  const { work, source } = useMemo(() => {
    return findUserWork(id, pendingWorks, approvedWorks);
  }, [id, pendingWorks, approvedWorks]);

  const [title, setTitle] = useState(work?.title || "");
  const [genre, setGenre] = useState(work?.genre || "");
  const [description, setDescription] = useState(work?.description || "");
  const [cover, setCover] = useState(work?.cover || "");
  const [content, setContent] = useState(
    work?.pages ? joinPagesForEditing(work.pages) : "",
  );
  const [error, setError] = useState("");

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
   * Зберігає зміни твору.
   *
   * @param {React.FormEvent<HTMLFormElement>} event - Подія submit.
   * @returns {void}
   */
  const handleSubmit = (event) => {
    event.preventDefault();

    if (hasTooLongWords(content)) {
      setError(
        "Текст містить надто довгий фрагмент без пробілів. Перевірте текст твору.",
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

    const updatedWork = {
      ...work,
      title: title.trim(),
      genre: genre.trim(),
      description: description.trim(),
      cover: cover.trim(),
      pages,
      status: "pending",
      updatedAt: new Date().toLocaleDateString("uk-UA"),
    };

    if (source === "pending") {
      const updatedPendingWorks = pendingWorks.map((pendingWork) =>
        pendingWork.id === work.id ? updatedWork : pendingWork,
      );

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
            Після редагування опублікованого твору він знову буде відправлений
            на модерацію.
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
              onChange={(event) => setContent(event.target.value)}
              rows="14"
            />
          </label>

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