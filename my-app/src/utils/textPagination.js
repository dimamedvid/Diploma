export const PAGE_SIZE = 3500;
export const MAX_WORD_LENGTH = 120;
export const MIN_CONTENT_LENGTH = 300;

/**
 * Перевіряє, чи містить текст надто довгі фрагменти без пробілів.
 *
 * @param {string} rawText - Текст твору.
 * @returns {boolean} true, якщо знайдено надто довгий фрагмент.
 */
export function hasTooLongWords(rawText) {
  return rawText
    .split(/\s+/)
    .some((word) => word.length > MAX_WORD_LENGTH);
}

/**
 * Автоматично розбиває текст твору на сторінки.
 *
 * Текст спочатку ділиться за абзацами. Якщо абзац занадто великий,
 * він додатково ділиться на частини за словами.
 *
 * @param {string} rawText - Повний текст твору.
 * @returns {string[]} Масив сторінок твору.
 */
export function splitTextAutomatically(rawText) {
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
 * Якщо автор використовує розділювач `---`, сторінки створюються вручну.
 * Якщо розділювача немає, текст автоматично ділиться на сторінки.
 *
 * @param {string} rawText - Повний текст твору.
 * @returns {string[]} Масив сторінок.
 */
export function splitTextIntoPages(rawText) {
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
export function joinPagesForEditing(pages) {
  return pages.join("\n\n---\n\n");
}

/**
 * Перевіряє, чи є посилання коректним URL для обкладинки.
 *
 * @param {string} url - Посилання на обкладинку.
 * @returns {boolean} true, якщо URL порожній або починається з http/https.
 */
export function isValidCoverUrl(url) {
  const normalizedUrl = url.trim();

  if (!normalizedUrl) {
    return true;
  }

  return (
    normalizedUrl.startsWith("http://") ||
    normalizedUrl.startsWith("https://")
  );
}