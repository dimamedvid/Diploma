const API = "http://localhost:4000/api";

/**
 * Обробляє HTTP-відповідь від API авторизації.
 *
 * Функція перетворює тіло відповіді у JSON і повертає його,
 * якщо запит виконано успішно. Якщо сервер повернув помилку,
 * функція викидає Error з повідомленням із відповіді або
 * стандартним текстом.
 *
 * @async
 * @param {Response} r - Об'єкт HTTP-відповіді fetch.
 * @returns {Promise<Object>} Розібраний JSON-об'єкт відповіді сервера.
 * @throws {Error} Якщо відповідь містить помилку або статус неуспішний.
 */
async function parse(r) {
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

/**
 * Реєструє нового користувача в системі.
 *
 * Надсилає POST-запит на сервер авторизації з даними користувача.
 *
 * @async
 * @param {Object} payload - Дані для реєстрації.
 * @param {string} payload.login - Логін користувача.
 * @param {string} payload.firstName - Ім'я користувача.
 * @param {string} payload.lastName - Прізвище користувача.
 * @param {string} payload.email - Email користувача.
 * @param {string} payload.password - Пароль користувача.
 * @returns {Promise<Object>} Об'єкт із токеном та даними користувача.
 * @throws {Error} Якщо реєстрація завершилася помилкою.
 */
export async function register(payload) {
  const r = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parse(r);
}

/**
 * Виконує вхід користувача в систему.
 *
 * Надсилає логін і пароль на сервер та отримує токен доступу
 * і дані користувача у випадку успішної авторизації.
 *
 * @async
 * @param {Object} payload - Облікові дані користувача.
 * @param {string} payload.login - Логін або email користувача.
 * @param {string} payload.password - Пароль користувача.
 * @returns {Promise<Object>} Об'єкт із токеном та даними користувача.
 * @throws {Error} Якщо логін або пароль некоректні.
 */
export async function login(payload) {
  const r = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parse(r);
}

/**
 * Отримує інформацію про поточного авторизованого користувача.
 *
 * Використовує Bearer-токен у заголовку Authorization.
 *
 * @async
 * @param {string} token - JWT токен доступу.
 * @returns {Promise<Object>} Об'єкт із даними поточного користувача.
 * @throws {Error} Якщо токен відсутній або невалідний.
 */
export async function me(token) {
  const r = await fetch(`${API}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parse(r);
}