const jwt = require("jsonwebtoken");

/**
 * Секретний ключ для підпису та перевірки JWT-токенів.
 *
 * Використовується серверною частиною для створення токенів
 * авторизації та подальшої перевірки їх валідності.
 *
 * У production-середовищі значення має зберігатися
 * у змінних оточення, а не безпосередньо в коді.
 *
 * @constant {string}
 */
const JWT_SECRET = "dev_secret_change_me";

/**
 * Створює JWT-токен для авторизованого користувача.
 *
 * Функція підписує переданий payload секретним ключем
 * і встановлює строк дії токена 7 днів.
 *
 * Використовується після успішної реєстрації або входу,
 * щоб клієнт міг виконувати авторизовані запити до API.
 *
 * @param {Object} payload - Дані користувача для запису в токен.
 * @param {string} payload.id - Унікальний ідентифікатор користувача.
 * @param {string} payload.login - Логін користувача.
 * @param {string} payload.email - Email користувача.
 * @param {string} payload.role - Роль користувача в системі.
 * @returns {string} Підписаний JWT-токен.
 */
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Перевіряє валідність JWT-токена та повертає його payload.
 *
 * Якщо токен коректний і не прострочений, функція повертає
 * декодовані дані користувача. Якщо токен недійсний,
 * бібліотека `jsonwebtoken` викидає помилку.
 *
 * @param {string} token - JWT-токен для перевірки.
 * @returns {Object} Декодований payload токена.
 * @throws {Error} Якщо токен недійсний, пошкоджений або прострочений.
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { signToken, verifyToken };