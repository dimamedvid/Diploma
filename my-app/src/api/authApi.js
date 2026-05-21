const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

/**
 * Виконує запит до backend auth API.
 *
 * @param {string} path - API path.
 * @param {Object} options - Fetch options.
 * @returns {Promise<unknown>} JSON response.
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
    throw new Error(data?.message || "Помилка авторизації.");
  }

  return data;
}

/**
 * Реєструє нового користувача через backend.
 *
 * @param {Object} userData - Дані користувача.
 * @returns {Promise<Object>} user + token.
 */
export function registerUser(userData) {
  return request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

/**
 * Авторизує користувача через backend.
 *
 * @param {Object} credentials - Login/email і пароль.
 * @returns {Promise<Object>} user + token.
 */
export function loginUser(credentials) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

/**
 * Отримує поточного користувача по JWT.
 *
 * @param {string} token - JWT token.
 * @returns {Promise<Object>} user.
 */
export function getCurrentUser(token) {
  return request("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}