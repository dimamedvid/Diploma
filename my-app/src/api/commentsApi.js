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
 * Отримує коментарі до твору.
 *
 * @param {number|string} workId - ID твору.
 * @returns {Promise<Object[]>} Список коментарів.
 */
export function getWorkComments(workId) {
  return request(`/api/works/${workId}/comments`);
}

/**
 * Додає коментар до твору.
 *
 * @param {number|string} workId - ID твору.
 * @param {Object} commentData - Дані коментаря.
 * @param {string} commentData.text - Текст коментаря.
 * @param {number|string} commentData.rating - Оцінка.
 * @param {string} token - JWT-токен.
 * @returns {Promise<Object>} Створений коментар.
 */
export function createWorkComment(workId, commentData, token) {
  return request(`/api/works/${workId}/comments`, {
    method: "POST",
    headers: getAuthHeader(token),
    body: JSON.stringify(commentData),
  });
}

/**
 * Редагує коментар.
 *
 * @param {number|string} commentId - ID коментаря.
 * @param {Object} commentData - Нові дані коментаря.
 * @param {string} commentData.text - Текст коментаря.
 * @param {number|string} commentData.rating - Оцінка.
 * @param {string} token - JWT-токен.
 * @returns {Promise<Object>} Оновлений коментар.
 */
export function updateComment(commentId, commentData, token) {
  return request(`/api/comments/${commentId}`, {
    method: "PUT",
    headers: getAuthHeader(token),
    body: JSON.stringify(commentData),
  });
}

/**
 * Видаляє коментар.
 *
 * @param {number|string} commentId - ID коментаря.
 * @param {string} token - JWT-токен.
 * @returns {Promise<Object>} Результат видалення.
 */
export function deleteComment(commentId, token) {
  return request(`/api/comments/${commentId}`, {
    method: "DELETE",
    headers: getAuthHeader(token),
  });
}

/**
 * Додає або прибирає лайк з коментаря.
 *
 * @param {number|string} commentId - ID коментаря.
 * @param {string} token - JWT-токен.
 * @returns {Promise<Object>} Оновлений коментар.
 */
export function toggleCommentLike(commentId, token) {
  return request(`/api/comments/${commentId}/like`, {
    method: "POST",
    headers: getAuthHeader(token),
  });
}