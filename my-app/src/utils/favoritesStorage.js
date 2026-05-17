import { STORAGE_KEYS } from "./storageKeys";
import { readFromStorage, writeToStorage } from "./worksStorage";

/**
 * Повертає список ID обраних творів.
 *
 * @returns {Array<number|string>} Список ID обраних творів.
 */
export function getFavoriteWorkIds() {
  return readFromStorage(STORAGE_KEYS.FAVORITES, []);
}

/**
 * Зберігає список ID обраних творів.
 *
 * @param {Array<number|string>} favoriteIds - Список ID обраних творів.
 * @returns {void}
 */
export function saveFavoriteWorkIds(favoriteIds) {
  writeToStorage(STORAGE_KEYS.FAVORITES, favoriteIds);
}

/**
 * Перевіряє, чи твір доданий в обране.
 *
 * @param {Array<number|string>} favoriteIds - Список ID обраних творів.
 * @param {number|string} workId - ID твору.
 * @returns {boolean} true, якщо твір в обраному.
 */
export function isWorkFavorite(favoriteIds, workId) {
  return favoriteIds.some((favoriteId) => String(favoriteId) === String(workId));
}

/**
 * Додає або прибирає твір з обраного.
 *
 * @param {Array<number|string>} favoriteIds - Поточний список ID обраних творів.
 * @param {number|string} workId - ID твору.
 * @returns {Array<number|string>} Оновлений список ID обраних творів.
 */
export function toggleFavoriteWork(favoriteIds, workId) {
  const isFavorite = isWorkFavorite(favoriteIds, workId);

  if (isFavorite) {
    return favoriteIds.filter(
      (favoriteId) => String(favoriteId) !== String(workId),
    );
  }

  return [...favoriteIds, workId];
}

/**
 * Повертає повні дані обраних творів.
 *
 * @param {Object[]} works - Список опублікованих творів.
 * @param {Array<number|string>} favoriteIds - Список ID обраних творів.
 * @returns {Object[]} Список обраних творів.
 */
export function getFavoriteWorks(works, favoriteIds) {
  return works.filter((work) => isWorkFavorite(favoriteIds, work.id));
}