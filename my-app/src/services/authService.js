import {
  getCurrentUser,
  loginUser,
  registerUser,
} from "../api/authApi";

/**
 * Реєструє нового користувача через backend API.
 *
 * Залишено для сумісності зі старими тестами та імпортами.
 *
 * @param {Object} userData - Дані користувача.
 * @returns {Promise<Object>} Дані авторизації.
 */
export function register(userData) {
  return registerUser(userData);
}

/**
 * Авторизує користувача через backend API.
 *
 * Залишено для сумісності зі старими тестами та імпортами.
 *
 * @param {Object} credentials - Логін/email і пароль.
 * @returns {Promise<Object>} Дані авторизації.
 */
export function login(credentials) {
  return loginUser(credentials);
}

/**
 * Отримує поточного користувача за JWT.
 *
 * Залишено для сумісності зі старими тестами та імпортами.
 *
 * @param {string} token - JWT token.
 * @returns {Promise<Object>} Поточний користувач.
 */
export function me(token) {
  return getCurrentUser(token);
}