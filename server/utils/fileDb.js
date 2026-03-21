const fs = require("fs");
const path = require("path");
const { createModuleLogger } = require("./logger");

/**
 * Шлях до JSON-файлу, у якому зберігаються дані користувачів.
 *
 * Використовується як локальне файлове сховище
 * для реєстрації, авторизації та читання списку користувачів.
 *
 * @constant {string}
 */
const usersPath = path.join(__dirname, "..", "data", "users.json");
const log = createModuleLogger("fileDb");

/**
 * Зчитує список користувачів із локального JSON-файлу.
 *
 * Функція читає вміст файлу `users.json`, перетворює його
 * з JSON-рядка у JavaScript-масив і повертає результат.
 *
 * Використовується серверною частиною для:
 * - перевірки існуючих користувачів;
 * - пошуку користувача під час входу;
 * - отримання актуального списку перед записом змін.
 *
 * @returns {Object[]} Масив об'єктів користувачів.
 * @throws {Error} Якщо файл не існує або містить некоректний JSON.
 */
function readUsers() {
  try {
    log.debug("Reading users from file", { filePath: usersPath });

    const raw = fs.readFileSync(usersPath, "utf-8");
    const users = JSON.parse(raw || "[]");

    log.info("Users loaded successfully", { count: users.length });
    return users;
  } catch (error) {
    log.error("Failed to read users file", {
      filePath: usersPath,
      errorMessage: error.message,
    });
    throw error;
  }
}

/**
 * Записує список користувачів у локальний JSON-файл.
 *
 * Функція серіалізує переданий масив користувачів у JSON-формат
 * і зберігає його у файл `users.json` з відступами для зручності читання.
 *
 * Використовується після створення нового користувача
 * або при зміні даних у файловому сховищі.
 *
 * @param {Object[]} users - Масив об'єктів користувачів для збереження.
 * @returns {void}
 * @throws {Error} Якщо під час запису у файл сталася помилка.
 */
function writeUsers(users) {
  try {
    log.debug("Writing users to file", {
      filePath: usersPath,
      count: users.length,
    });

    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2), "utf-8");

    log.info("Users saved successfully", { count: users.length });
  } catch (error) {
    log.error("Failed to write users file", {
      filePath: usersPath,
      errorMessage: error.message,
    });
    throw error;
  }
}

module.exports = { readUsers, writeUsers };