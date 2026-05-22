import { STORAGE_KEYS } from "./storageKeys";

export const APPROVED_WORKS_STORAGE_KEY = STORAGE_KEYS.APPROVED_WORKS;
export const PENDING_WORKS_STORAGE_KEY = STORAGE_KEYS.PENDING_WORKS;
export const REJECTED_WORKS_STORAGE_KEY = STORAGE_KEYS.REJECTED_WORKS;
export const COMMENTS_STORAGE_KEY = STORAGE_KEYS.COMMENTS;

/**
 * Безпечно отримує JSON-дані з localStorage.
 *
 * @param {string} key - Ключ localStorage.
 * @param {Object|Array|string|number|boolean|null} fallback - Значення за замовчуванням.
 * @returns {Object|Array|string|number|boolean|null} Дані з localStorage або fallback.
 */
export function readFromStorage(key, fallback) {
  try {
    const savedValue = localStorage.getItem(key);

    return savedValue ? JSON.parse(savedValue) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Записує JSON-дані у localStorage.
 *
 * @param {string} key - Ключ localStorage.
 * @param {Object|Array|string|number|boolean|null} value - Значення для збереження.
 * @returns {void}
 */
export function writeToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * Повертає повне ім'я користувача.
 *
 * @param {Object} user - Дані користувача.
 * @returns {string} Повне ім'я або логін користувача.
 */
export function getUserFullName(user) {
  return `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.login;
}

/**
 * Повертає стабільний ідентифікатор користувача.
 *
 * @param {Object} user - Дані користувача.
 * @returns {string} Ідентифікатор користувача.
 */
export function getUserId(user) {
  return String(user.id || user.login || user.email);
}

/**
 * Повертає всі опубліковані твори.
 *
 * @param {Object[]} baseWorks - Початковий список творів.
 * @returns {Object[]} Список базових і підтверджених користувацьких творів.
 */
export function getAllPublishedWorks(baseWorks) {
  const approvedWorks = readFromStorage(APPROVED_WORKS_STORAGE_KEY, []);

  return [...baseWorks, ...approvedWorks];
}

/**
 * Повертає коментарі конкретного твору.
 *
 * @param {Object.<string, Array>} commentsByWork - Коментарі, згруповані за ID твору.
 * @param {number|string} workId - ID твору.
 * @returns {Array} Масив коментарів твору.
 */
export function getCommentsForWork(commentsByWork, workId) {
  return commentsByWork[String(workId)] || [];
}

/**
 * Розраховує рейтинг твору на основі оцінок у коментарях.
 *
 * Якщо користувацьких оцінок немає, повертається базовий рейтинг твору.
 *
 * @param {Object} work - Твір.
 * @param {Object.<string, Array>} commentsByWork - Коментарі, згруповані за ID твору.
 * @returns {{ rating: number, ratingsCount: number, isCalculated: boolean }} Дані рейтингу.
 */
export function getWorkRatingStats(work, commentsByWork) {
  const comments = getCommentsForWork(commentsByWork, work.id);

  const ratings = comments
    .map((comment) => Number(comment.rating))
    .filter((rating) => !Number.isNaN(rating) && rating > 0);

  if (ratings.length === 0) {
    return {
      rating: Number(work.rating || 0),
      ratingsCount: 0,
      isCalculated: false,
    };
  }

  const total = ratings.reduce((sum, rating) => sum + rating, 0);

  return {
    rating: total / ratings.length,
    ratingsCount: ratings.length,
    isCalculated: true,
  };
}

/**
 * Додає до творів актуальний рейтинг, розрахований на основі коментарів.
 *
 * @param {Object[]} works - Список творів.
 * @returns {Object[]} Список творів з актуальним рейтингом.
 */
export function enrichWorksWithRating(works) {
  const commentsByWork = readFromStorage(COMMENTS_STORAGE_KEY, {});

  return works.map((work) => {
    const ratingStats = getWorkRatingStats(work, commentsByWork);

    return {
      ...work,
      rating: ratingStats.rating,
      ratingsCount: ratingStats.ratingsCount,
      isRatingCalculated: ratingStats.isCalculated,
    };
  });
}