import { STORAGE_KEYS } from "./storageKeys";
import { getUserId, readFromStorage, writeToStorage } from "./worksStorage";

export const MAX_FAVORITE_GENRES = 3;

/**
 * Повертає всі улюблені жанри, згруповані за користувачами.
 *
 * @returns {Object.<string, string[]>} Об'єкт улюблених жанрів користувачів.
 */
export function getFavoriteGenresByUser() {
  return readFromStorage(STORAGE_KEYS.FAVORITE_GENRES, {});
}

/**
 * Зберігає всі улюблені жанри користувачів.
 *
 * @param {Object.<string, string[]>} favoriteGenresByUser - Дані улюблених жанрів.
 * @returns {void}
 */
export function saveFavoriteGenresByUser(favoriteGenresByUser) {
  writeToStorage(STORAGE_KEYS.FAVORITE_GENRES, favoriteGenresByUser);
}

/**
 * Повертає улюблені жанри конкретного користувача.
 *
 * @param {Object.<string, string[]>} favoriteGenresByUser - Дані улюблених жанрів.
 * @param {string} userId - ID користувача.
 * @returns {string[]} Список улюблених жанрів користувача.
 */
export function getUserFavoriteGenres(favoriteGenresByUser, userId) {
  return favoriteGenresByUser[userId] || [];
}

/**
 * Повертає улюблені жанри поточного користувача.
 *
 * @param {Object|null} user - Дані поточного користувача.
 * @returns {string[]} Список улюблених жанрів.
 */
export function getFavoriteGenresForUser(user) {
  if (!user) {
    return [];
  }

  const favoriteGenresByUser = getFavoriteGenresByUser();
  const userId = getUserId(user);

  return getUserFavoriteGenres(favoriteGenresByUser, userId);
}

/**
 * Повертає список усіх доступних жанрів з опублікованих творів.
 *
 * @param {Object[]} works - Список творів.
 * @returns {string[]} Унікальні жанри.
 */
export function getAvailableGenres(works) {
  return [...new Set(works.map((work) => work.genre))];
}

/**
 * Перемикає жанр у списку улюблених жанрів користувача.
 *
 * Якщо жанр уже обраний, він видаляється.
 * Якщо жанр не обраний і ліміт не перевищено, він додається.
 *
 * @param {Object.<string, string[]>} favoriteGenresByUser - Поточні дані жанрів.
 * @param {string} userId - ID користувача.
 * @param {string} genre - Назва жанру.
 * @returns {Object.<string, string[]>} Оновлені дані жанрів.
 */
export function toggleFavoriteGenreForUser(
  favoriteGenresByUser,
  userId,
  genre,
) {
  const selectedGenres = getUserFavoriteGenres(favoriteGenresByUser, userId);
  const isSelected = selectedGenres.includes(genre);

  if (!isSelected && selectedGenres.length >= MAX_FAVORITE_GENRES) {
    return favoriteGenresByUser;
  }

  const updatedGenres = isSelected
    ? selectedGenres.filter((selectedGenre) => selectedGenre !== genre)
    : [...selectedGenres, genre];

  return {
    ...favoriteGenresByUser,
    [userId]: updatedGenres,
  };
}

/**
 * Сортує твори так, щоб твори з улюблених жанрів були першими.
 *
 * Якщо обидва твори підходять або обидва не підходять,
 * вище буде твір з більшим рейтингом.
 *
 * @param {Object[]} works - Список творів.
 * @param {string[]} favoriteGenres - Улюблені жанри користувача.
 * @returns {Object[]} Відсортовані твори.
 */
export function sortWorksByFavoriteGenres(works, favoriteGenres) {
  return [...works].sort((firstWork, secondWork) => {
    const firstMatches = favoriteGenres.includes(firstWork.genre);
    const secondMatches = favoriteGenres.includes(secondWork.genre);

    if (firstMatches !== secondMatches) {
      return firstMatches ? -1 : 1;
    }

    return Number(secondWork.rating || 0) - Number(firstWork.rating || 0);
  });
}