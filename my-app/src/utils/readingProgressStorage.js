import { STORAGE_KEYS } from "./storageKeys";
import { readFromStorage, writeToStorage } from "./worksStorage";

/**
 * Повертає весь прогрес читання користувачів.
 *
 * @returns {Object.<string, Object>} Прогрес читання за користувачами.
 */
export function getAllReadingProgress() {
  return readFromStorage(STORAGE_KEYS.READING_PROGRESS, {});
}

/**
 * Зберігає весь прогрес читання користувачів.
 *
 * @param {Object.<string, Object>} readingProgressByUser - Дані прогресу читання.
 * @returns {void}
 */
export function saveAllReadingProgress(readingProgressByUser) {
  writeToStorage(STORAGE_KEYS.READING_PROGRESS, readingProgressByUser);
}

/**
 * Повертає збережену сторінку твору для користувача.
 *
 * @param {string} userId - ID користувача.
 * @param {number|string} workId - ID твору.
 * @returns {number} Індекс сторінки.
 */
export function getSavedReadingPage(userId, workId) {
  const readingProgressByUser = getAllReadingProgress();

  return Number(readingProgressByUser[userId]?.[String(workId)] || 0);
}

/**
 * Зберігає поточну сторінку читання твору.
 *
 * @param {string} userId - ID користувача.
 * @param {number|string} workId - ID твору.
 * @param {number} pageIndex - Індекс сторінки.
 * @returns {Object.<string, Object>} Оновлений прогрес читання.
 */
export function saveReadingPage(userId, workId, pageIndex) {
  const readingProgressByUser = getAllReadingProgress();

  const updatedReadingProgressByUser = {
    ...readingProgressByUser,
    [userId]: {
      ...(readingProgressByUser[userId] || {}),
      [String(workId)]: pageIndex,
    },
  };

  saveAllReadingProgress(updatedReadingProgressByUser);

  return updatedReadingProgressByUser;
}

/**
 * Видаляє твір зі списку "Продовжити читання".
 *
 * Сам твір не видаляється, очищується лише прогрес читання.
 *
 * @param {Object.<string, Object>} readingProgressByUser - Поточний прогрес читання.
 * @param {string} userId - ID користувача.
 * @param {number|string} workId - ID твору.
 * @returns {Object.<string, Object>} Оновлений прогрес читання.
 */
export function deleteReadingProgressByWork(
  readingProgressByUser,
  userId,
  workId,
) {
  const updatedUserProgress = {
    ...(readingProgressByUser[userId] || {}),
  };

  delete updatedUserProgress[String(workId)];

  return {
    ...readingProgressByUser,
    [userId]: updatedUserProgress,
  };
}

/**
 * Повертає список творів, які користувач уже починав читати.
 *
 * @param {Object[]} works - Опубліковані твори.
 * @param {Object.<string, Object>} readingProgressByUser - Прогрес читання.
 * @param {string} userId - ID користувача.
 * @returns {Object[]} Список творів із прогресом.
 */
export function getContinueReadingWorks(works, readingProgressByUser, userId) {
  const userProgress = readingProgressByUser[userId] || {};

  return Object.entries(userProgress)
    .map(([workId, pageIndex]) => {
      const work = works.find((item) => String(item.id) === String(workId));

      if (!work) {
        return null;
      }

      const pagesCount = work.pages?.length || 0;
      const safePageIndex = Math.min(
        Number(pageIndex),
        Math.max(pagesCount - 1, 0),
      );

      return {
        ...work,
        currentPage: safePageIndex,
        pagesCount,
      };
    })
    .filter(Boolean)
    .filter((work) => work.pagesCount > 0)
    .sort((firstWork, secondWork) => Number(secondWork.id) - Number(firstWork.id));
}