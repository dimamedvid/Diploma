const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

/**
 * Виконує HTTP-запит до backend API.
 *
 * @param {string} path - Шлях API.
 * @param {Object} options - Налаштування fetch.
 * @returns {Promise<unknown>} JSON-відповідь сервера.
 */
async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Помилка запиту до сервера.");
  }

  return data;
}

/**
 * Повертає заголовок авторизації.
 *
 * @param {string} token - JWT-токен.
 * @returns {Object} Headers з Authorization.
 */
function getAuthHeader(token) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Отримує ID обраних творів користувача.
 *
 * @param {string} token - JWT-токен.
 * @returns {Promise<string[]>} Масив ID творів.
 */
export function getFavoriteWorkIdsFromApi(token) {
  return request("/api/me/favorites", {
    headers: getAuthHeader(token),
  });
}

/**
 * Додає або прибирає твір з обраного.
 *
 * @param {number|string} workId - ID твору.
 * @param {string} token - JWT-токен.
 * @returns {Promise<Object>} Стан обраного.
 */
export function toggleFavoriteWorkInApi(workId, token) {
  return request(`/api/me/favorites/${workId}`, {
    method: "POST",
    headers: getAuthHeader(token),
  });
}

/**
 * Отримує прогрес читання користувача.
 *
 * @param {string} token - JWT-токен.
 * @returns {Promise<Object[]>} Список прогресу читання.
 */
export function getReadingProgressFromApi(token) {
  return request("/api/me/reading-progress", {
    headers: getAuthHeader(token),
  });
}

/**
 * Зберігає поточну сторінку читання.
 *
 * @param {number|string} workId - ID твору.
 * @param {number} currentPage - Поточна сторінка.
 * @param {string} token - JWT-токен.
 * @returns {Promise<Object>} Оновлений прогрес.
 */
export function saveReadingProgressToApi(workId, currentPage, token) {
  return request(`/api/me/reading-progress/${workId}`, {
    method: "PUT",
    headers: getAuthHeader(token),
    body: JSON.stringify({ currentPage }),
  });
}

/**
 * Видаляє прогрес читання конкретного твору.
 *
 * @param {number|string} workId - ID твору.
 * @param {string} token - JWT-токен.
 * @returns {Promise<Object>} Результат видалення.
 */
export function deleteReadingProgressFromApi(workId, token) {
  return request(`/api/me/reading-progress/${workId}`, {
    method: "DELETE",
    headers: getAuthHeader(token),
  });
}

/**
 * Отримує улюблені жанри користувача.
 *
 * @param {string} token - JWT-токен.
 * @returns {Promise<string[]>} Масив жанрів.
 */
export function getFavoriteGenresFromApi(token) {
  return request("/api/me/favorite-genres", {
    headers: getAuthHeader(token),
  });
}

/**
 * Зберігає улюблені жанри користувача.
 *
 * @param {string[]} genres - Масив жанрів.
 * @param {string} token - JWT-токен.
 * @returns {Promise<string[]>} Збережені жанри.
 */
export function saveFavoriteGenresToApi(genres, token) {
  return request("/api/me/favorite-genres", {
    method: "PUT",
    headers: getAuthHeader(token),
    body: JSON.stringify({ genres }),
  });
}