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
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(workData),
  });
}