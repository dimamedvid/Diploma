const express = require("express");
const bcrypt = require("bcryptjs");
const { readUsers, writeUsers } = require("../utils/fileDb");
const { signToken } = require("../utils/jwt");
const { authMiddleware } = require("../middlewares/auth.middleware");
const { createModuleLogger } = require("../utils/logger");
const AppError = require("../utils/AppError");

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
 * - middleware перевірки авторизації;
 * - централізована обробка помилок через AppError.
 */

const router = express.Router();
const log = createModuleLogger("auth.routes");

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
 * У разі помилки створює контрольований AppError
 * або передає технічний виняток у централізований error handler.
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
 * @param {Function} next - Функція переходу до наступного middleware.
 * @returns {Promise<Object|void>} JSON-об'єкт із токеном та даними користувача.
 */
router.post("/register", async (req, res, next) => {
  try {
    const login = String(req.body.login || "").trim();
    const firstName = String(req.body.firstName || "").trim();
    const lastName = String(req.body.lastName || "").trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    log.info("User registration attempt", {
      requestId: req.requestId,
      login,
      email,
    });

    if (!login || !firstName || !lastName || !email || !password) {
      throw new AppError("Будь ласка, заповніть усі обов’язкові поля.", 400, {
        field: "common",
        reason: "MISSING_REQUIRED_FIELDS",
      });
    }

    if (!isLoginValid(login)) {
      throw new AppError("Логін має містити 4–25 символів, лише латинські літери та цифри.", 400, {
        field: "login",
        value: login,
        reason: "INVALID_LOGIN_FORMAT",
      });
    }

    if (firstName.length < 1 || firstName.length > 50) {
      throw new AppError("Ім’я повинно містити від 1 до 50 символів.", 400, {
        field: "firstName",
        reason: "INVALID_FIRST_NAME_LENGTH",
      });
    }

    if (lastName.length < 1 || lastName.length > 50) {
      throw new AppError("Прізвище повинно містити від 1 до 50 символів.", 400, {
        field: "lastName",
        reason: "INVALID_LAST_NAME_LENGTH",
      });
    }

    if (!isEmailValid(email)) {
      throw new AppError("Email має бути у форматі name@mail.com.", 400, {
        field: "email",
        value: email,
        reason: "INVALID_EMAIL_FORMAT",
      });
    }

    if (!isPasswordValid(password)) {
      throw new AppError(
        "Пароль має містити 8–20 символів, щонайменше одну літеру та одну цифру.",
        400,
        {
          field: "password",
          reason: "INVALID_PASSWORD_FORMAT",
        },
      );
    }

    const users = readUsers();

    const loginExists = users.some(
      (u) => String(u.login || "").trim().toLowerCase() === login.toLowerCase(),
    );
    if (loginExists) {
      throw new AppError("Такий логін уже зайнятий.", 409, {
        field: "login",
        value: login,
        reason: "LOGIN_ALREADY_EXISTS",
      });
    }

    const emailExists = users.some((u) => normalizeEmail(u.email) === email);
    if (emailExists) {
      throw new AppError("Такий email уже зареєстрований.", 409, {
        field: "email",
        value: email,
        reason: "EMAIL_ALREADY_EXISTS",
      });
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

    log.info("User registered successfully", {
      requestId: req.requestId,
      userId: newUser.id,
      login: newUser.login,
      email: newUser.email,
      role: newUser.role,
    });

    return res.json({
      success: true,
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
  } catch (error) {
    if (!(error instanceof AppError)) {
      log.error("User registration failed with exception", {
        requestId: req.requestId,
        login: req.body?.login,
        email: req.body?.email,
        errorMessage: error.message,
      });
    }

    return next(error);
  }
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
 * У разі помилки створює контрольований AppError
 * або передає технічний виняток у централізований error handler.
 *
 * @async
 * @param {Object} req - HTTP-запит Express.
 * @param {Object} req.body - Тіло запиту з обліковими даними.
 * @param {string} req.body.login - Логін або email користувача.
 * @param {string} req.body.password - Пароль користувача.
 * @param {Object} res - HTTP-відповідь Express.
 * @param {Function} next - Функція переходу до наступного middleware.
 * @returns {Promise<Object|void>} JSON-об'єкт із токеном та даними користувача.
 */
router.post("/login", async (req, res, next) => {
  try {
    const loginInput = String(req.body.login || "").trim();
    const password = String(req.body.password || "");

    log.info("User login attempt", {
      requestId: req.requestId,
      loginInput,
    });

    if (!loginInput || !password) {
      throw new AppError("Будь ласка, введіть логін або email та пароль.", 400, {
        field: "common",
        reason: "MISSING_CREDENTIALS",
      });
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
      throw new AppError("Користувача з такими даними не знайдено або пароль неправильний.", 401, {
        field: "login",
        value: loginInput,
        reason: "USER_NOT_FOUND",
      });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new AppError("Користувача з такими даними не знайдено або пароль неправильний.", 401, {
        field: "password",
        reason: "INVALID_PASSWORD",
      });
    }

    const token = signToken({
      id: user.id,
      login: user.login,
      email: user.email,
      role: user.role,
    });

    log.info("User login successful", {
      requestId: req.requestId,
      userId: user.id,
      login: user.login,
      email: user.email,
      role: user.role,
    });

    return res.json({
      success: true,
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
  } catch (error) {
    if (!(error instanceof AppError)) {
      log.error("User login failed with exception", {
        requestId: req.requestId,
        loginInput: req.body?.login,
        errorMessage: error.message,
      });
    }

    return next(error);
  }
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
 * Додатково логуються дані про запит користувача до профілю.
 *
 * @param {Object} req - HTTP-запит Express.
 * @param {Object} req.user - Дані авторизованого користувача з JWT payload.
 * @param {Object} res - HTTP-відповідь Express.
 * @returns {Object} JSON-об'єкт із даними поточного користувача.
 */
router.get("/me", authMiddleware, (req, res) => {
  log.info("Current user profile requested", {
    requestId: req.requestId,
    userId: req.user?.id,
    login: req.user?.login,
    role: req.user?.role,
  });

  return res.json({
    success: true,
    user: req.user,
  });
});

module.exports = router;