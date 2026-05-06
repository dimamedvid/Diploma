export const APPROVED_WORKS_STORAGE_KEY = "approvedWorks";
export const PENDING_WORKS_STORAGE_KEY = "pendingWorks";

/**
 * Безпечно отримує JSON-дані з localStorage.
 *
 * @param {string} key - Ключ localStorage.
 * @param {Object|Array|string|number|boolean|null} fallback - Значення за замовчуванням.
 * @returns {Object|Array|string|number|boolean|null} Дані з localStorage або fallback.
 */
export function readFromStorage(key, fallback) {
  try {
    const savedValue = localStorage.getItem(key);
    return savedValue ? JSON.parse(savedValue) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Записує JSON-дані у localStorage.
 *
 * @param {string} key - Ключ localStorage.
 * @param {Object|Array|string|number|boolean|null} value - Значення для збереження.
 * @returns {void}
 */
export function writeToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * Повертає повне ім'я користувача.
 *
 * @param {Object} user - Дані користувача.
 * @returns {string} Повне ім'я або логін користувача.
 */
export function getUserFullName(user) {
  return `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.login;
}

/**
 * Повертає стабільний ідентифікатор користувача.
 *
 * @param {Object} user - Дані користувача.
 * @returns {string} Ідентифікатор користувача.
 */
export function getUserId(user) {
  return String(user.id || user.login || user.email);
}

/**
 * Повертає всі опубліковані твори.
 *
 * @param {Object[]} baseWorks - Початкові твори з works.json.
 * @returns {Object[]} Список базових і підтверджених користувацьких творів.
 */
export function getAllPublishedWorks(baseWorks) {
  const approvedWorks = readFromStorage(APPROVED_WORKS_STORAGE_KEY, []);

  return [...baseWorks, ...approvedWorks];
}