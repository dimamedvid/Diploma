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
 * Отримує список опублікованих творів з backend.
 *
 * @returns {Promise<Object[]>} Список творів.
 */
export function getWorks() {
  return request("/api/works");
}

/**
 * Отримує один твір разом зі сторінками.
 *
 * @param {number|string} workId - ID твору.
 * @returns {Promise<Object>} Твір.
 */
export function getWorkById(workId) {
  return request(`/api/works/${workId}`);
}

/**
 * Створює новий твір через backend.
 *
 * @param {Object} workData - Дані твору.
 * @param {string} token - JWT-токен користувача.
 * @returns {Promise<Object>} Створений твір.
 */
export function createWork(workData, token) {
  return request("/api/works", {
    method: "POST",
    headers: getAuthHeader(token),
    body: JSON.stringify(workData),
  });
}

/**
 * Отримує твори поточного користувача.
 *
 * @param {string} token - JWT-токен користувача.
 * @returns {Promise<Object[]>} Список власних творів користувача.
 */
export function getMyWorks(token) {
  return request("/api/works/my", {
    headers: getAuthHeader(token),
  });
}

/**
 * Отримує твори, які очікують модерації.
 *
 * @param {string} token - JWT-токен модератора або адміністратора.
 * @returns {Promise<Object[]>} Список pending-творів.
 */
export function getPendingWorksForModeration(token) {
  return request("/api/works/moderation/pending", {
    headers: getAuthHeader(token),
  });
}

/**
 * Підтверджує твір.
 *
 * @param {number|string} workId - ID твору.
 * @param {string} token - JWT-токен модератора або адміністратора.
 * @returns {Promise<Object>} Підтверджений твір.
 */
export function approveWork(workId, token) {
  return request(`/api/works/${workId}/approve`, {
    method: "PATCH",
    headers: getAuthHeader(token),
  });
}

/**
 * Відхиляє твір із причиною.
 *
 * @param {number|string} workId - ID твору.
 * @param {string} reason - Причина відхилення.
 * @param {string} token - JWT-токен модератора або адміністратора.
 * @returns {Promise<Object>} Відхилений твір.
 */
export function rejectWork(workId, reason, token) {
  return request(`/api/works/${workId}/reject`, {
    method: "PATCH",
    headers: getAuthHeader(token),
    body: JSON.stringify({ reason }),
  });
}