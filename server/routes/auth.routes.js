const express = require("express");
const bcrypt = require("bcryptjs");
const { readUsers, writeUsers } = require("../utils/fileDb");
const { signToken } = require("../utils/jwt");
const { authMiddleware } = require("../middlewares/auth.middleware");

/**
 * Маршрути авторизації та реєстрації користувачів.
 *
 * Модуль реалізує API для:
 * - реєстрації нового користувача;
 * - входу в систему;
 * - отримання даних поточного авторизованого користувача.
 *
 * У процесі обробки запитів використовуються:
 * - валідація вхідних даних;
 * - перевірка унікальності логіна та email;
 * - хешування пароля;
 * - генерація JWT-токена;
 * - middleware перевірки авторизації.
 */

const router = express.Router();

/**
 * Нормалізує email перед валідацією або порівнянням.
 *
 * Видаляє зайві пробіли на початку та в кінці рядка
 * і переводить email до нижнього регістру.
 *
 * @param {string} email - Email, отриманий із запиту або сховища.
 * @returns {string} Нормалізований email.
 */
function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

/**
 * Перевіряє коректність формату email.
 *
 * Використовує регулярний вираз для базової перевірки,
 * що email містить локальну частину, символ `@`
 * та доменну частину.
 *
 * @param {string} email - Email для перевірки.
 * @returns {boolean} `true`, якщо email має коректний формат, інакше `false`.
 */
function isEmailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Перевіряє коректність логіна.
 *
 * Логін повинен містити від 4 до 25 символів
 * і складатися лише з латинських літер та цифр.
 *
 * @param {string} login - Логін користувача.
 * @returns {boolean} `true`, якщо логін відповідає правилам, інакше `false`.
 */
function isLoginValid(login) {
  return /^[a-zA-Z0-9]{4,25}$/.test(login);
}

/**
 * Перевіряє коректність пароля.
 *
 * Пароль повинен:
 * - містити від 8 до 20 символів;
 * - містити хоча б одну літеру;
 * - містити хоча б одну цифру.
 *
 * @param {string} password - Пароль користувача.
 * @returns {boolean} `true`, якщо пароль відповідає правилам, інакше `false`.
 */
function isPasswordValid(password) {
  return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$/.test(password);
}

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Реєстрація нового користувача
 *     description: Створює нового користувача, хешує пароль і повертає JWT-токен та дані користувача.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           examples:
 *             default:
 *               value:
 *                 login: user123
 *                 firstName: Dmytro
 *                 lastName: Medvid
 *                 email: user@mail.com
 *                 password: Passw0rd123
 *     responses:
 *       "200":
 *         description: Користувача успішно зареєстровано
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthSuccessResponse'
 *             examples:
 *               success:
 *                 value:
 *                   token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                   user:
 *                     id: "1740000000000"
 *                     login: user123
 *                     firstName: Dmytro
 *                     lastName: Medvid
 *                     email: user@mail.com
 *                     role: user
 *       "400":
 *         description: Помилка валідації вхідних даних
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingFields:
 *                 value:
 *                   message: Будь ласка, заповніть усі обов’язкові поля.
 *       "409":
 *         description: Конфлікт через зайнятий логін або email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               duplicateLogin:
 *                 value:
 *                   message: Такий логін вже зайнятий.
 */

/**
 * POST /api/auth/register
 *
 * Реєструє нового користувача в системі.
 *
 * Алгоритм обробки:
 * 1. Отримує та нормалізує дані з тіла запиту.
 * 2. Перевіряє обов'язкові поля.
 * 3. Виконує валідацію логіна, імені, прізвища, email і пароля.
 * 4. Завантажує список користувачів із файлового сховища.
 * 5. Перевіряє унікальність логіна та email.
 * 6. Хешує пароль.
 * 7. Створює нового користувача та зберігає його у сховищі.
 * 8. Генерує JWT-токен і повертає публічні дані користувача.
 *
 * @async
 * @param {Object} req - HTTP-запит Express.
 * @param {Object} req.body - Тіло запиту з даними користувача.
 * @param {string} req.body.login - Логін користувача.
 * @param {string} req.body.firstName - Ім'я користувача.
 * @param {string} req.body.lastName - Прізвище користувача.
 * @param {string} req.body.email - Email користувача.
 * @param {string} req.body.password - Пароль користувача.
 * @param {Object} res - HTTP-відповідь Express.
 * @returns {Promise<Object>} JSON-об'єкт із токеном та даними користувача.
 */
router.post("/register", async (req, res) => {
  const login = String(req.body.login || "").trim();
  const firstName = String(req.body.firstName || "").trim();
  const lastName = String(req.body.lastName || "").trim();
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || "");

  if (!login || !firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: "Будь ласка, заповніть усі обов’язкові поля." });
  }

  if (!isLoginValid(login)) {
    return res.status(400).json({ message: "Логін: 4–25 символів, латинські літери/цифри." });
  }

  if (firstName.length < 1 || firstName.length > 50) {
    return res.status(400).json({ message: "Ім’я: 1–50 символів." });
  }

  if (lastName.length < 1 || lastName.length > 50) {
    return res.status(400).json({ message: "Прізвище: 1–50 символів." });
  }

  if (!isEmailValid(email)) {
    return res.status(400).json({ message: "Email має бути у форматі name@mail.com." });
  }

  if (!isPasswordValid(password)) {
    return res.status(400).json({ message: "Пароль: 8–20 символів, мінімум 1 літера і 1 цифра." });
  }

  const users = readUsers();

  const loginExists = users.some(
    (u) => String(u.login || "").trim().toLowerCase() === login.toLowerCase(),
  );
  if (loginExists) {
    return res.status(409).json({ message: "Такий логін вже зайнятий." });
  }

  const emailExists = users.some((u) => normalizeEmail(u.email) === email);
  if (emailExists) {
    return res.status(409).json({ message: "Такий email вже зареєстрований." });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = {
    id: Date.now().toString(),
    login,
    firstName,
    lastName,
    email,
    passwordHash,
    role: "user",
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  writeUsers(users);

  const token = signToken({
    id: newUser.id,
    login: newUser.login,
    email: newUser.email,
    role: newUser.role,
  });

  return res.json({
    token,
    user: {
      id: newUser.id,
      login: newUser.login,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      role: newUser.role,
    },
  });
});

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Вхід користувача в систему
 *     description: Перевіряє логін або email та пароль, після чого повертає JWT-токен і дані користувача.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             default:
 *               value:
 *                 login: user123
 *                 password: Passw0rd123
 *     responses:
 *       "200":
 *         description: Успішна авторизація
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthSuccessResponse'
 *             examples:
 *               success:
 *                 value:
 *                   token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                   user:
 *                     id: "1740000000000"
 *                     login: user123
 *                     firstName: Dmytro
 *                     lastName: Medvid
 *                     email: user@mail.com
 *                     role: user
 *       "400":
 *         description: Не передано логін або пароль
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingData:
 *                 value:
 *                   message: Будь ласка, введіть логін і пароль.
 *       "401":
 *         description: Невірний логін або пароль
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidCredentials:
 *                 value:
 *                   message: Невірний логін або пароль.
 */

/**
 * POST /api/auth/login
 *
 * Авторизує користувача в системі.
 *
 * Алгоритм обробки:
 * 1. Отримує логін або email і пароль із тіла запиту.
 * 2. Перевіряє, що обидва поля заповнені.
 * 3. Завантажує список користувачів із файлового сховища.
 * 4. Шукає користувача спочатку за логіном, потім за email.
 * 5. Перевіряє правильність пароля через bcrypt.
 * 6. Генерує JWT-токен і повертає публічні дані користувача.
 *
 * @async
 * @param {Object} req - HTTP-запит Express.
 * @param {Object} req.body - Тіло запиту з обліковими даними.
 * @param {string} req.body.login - Логін або email користувача.
 * @param {string} req.body.password - Пароль користувача.
 * @param {Object} res - HTTP-відповідь Express.
 * @returns {Promise<Object>} JSON-об'єкт із токеном та даними користувача.
 */
router.post("/login", async (req, res) => {
  const loginInput = String(req.body.login || "").trim();
  const password = String(req.body.password || "");

  if (!loginInput || !password) {
    return res.status(400).json({ message: "Будь ласка, введіть логін і пароль." });
  }

  const users = readUsers();

  let user = users.find(
    (u) => String(u.login || "").trim().toLowerCase() === loginInput.toLowerCase(),
  );

  if (!user) {
    const asEmail = normalizeEmail(loginInput);
    user = users.find((u) => normalizeEmail(u.email) === asEmail);
  }

  if (!user) {
    return res.status(401).json({ message: "Невірний логін або пароль." });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: "Невірний логін або пароль." });
  }

  const token = signToken({
    id: user.id,
    login: user.login,
    email: user.email,
    role: user.role,
  });

  return res.json({
    token,
    user: {
      id: user.id,
      login: user.login,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    },
  });
});

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Отримання даних поточного користувача
 *     description: Повертає payload користувача з валідного JWT-токена.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Дані поточного авторизованого користувача
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MeResponse'
 *             examples:
 *               success:
 *                 value:
 *                   user:
 *                     id: "1740000000000"
 *                     login: user123
 *                     email: user@mail.com
 *                     role: user
 *                     iat: 1710000000
 *                     exp: 1710600000
 *       "401":
 *         description: Токен відсутній або невалідний
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingToken:
 *                 value:
 *                   message: No token
 */

/**
 * GET /api/auth/me
 *
 * Повертає дані поточного авторизованого користувача.
 *
 * Маршрут є захищеним і працює тільки після успішного
 * проходження middleware `authMiddleware`, який перевіряє JWT
 * та записує декодовані дані користувача у `req.user`.
 *
 * @param {Object} req - HTTP-запит Express.
 * @param {Object} req.user - Дані авторизованого користувача з JWT payload.
 * @param {Object} res - HTTP-відповідь Express.
 * @returns {Object} JSON-об'єкт із даними поточного користувача.
 */
router.get("/me", authMiddleware, (req, res) => {
  return res.json({ user: req.user });
});

module.exports = router;