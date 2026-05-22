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
 * Отримує статистику адміністратора.
 *
 * @param {string} token - JWT-токен.
 * @returns {Promise<Object>} Статистика системи.
 */
export function getAdminStats(token) {
  return request("/api/admin/stats", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}