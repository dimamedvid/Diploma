const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  createUser,
  findExistingUser,
  findUserByLoginOrEmail,
} = require("../utils/userDb");
const { createModuleLogger } = require("../utils/logger");
const AppError = require("../utils/AppError");

const router = express.Router();
const log = createModuleLogger("auth.routes");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const PASSWORD_SALT_ROUNDS = 10;

/**
 * Перевіряє, чи значення є непорожнім рядком.
 *
 * @param {unknown} value - Значення.
 * @returns {boolean} true, якщо це непорожній рядок.
 */
function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Перевіряє базову валідність email.
 *
 * @param {string} email - Email.
 * @returns {boolean} true, якщо email схожий на коректний.
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Створює JWT token для користувача.
 *
 * @param {Object} user - Користувач.
 * @returns {string} JWT token.
 */
function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      login: user.login,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    },
  );
}

/**
 * Створює відповідь авторизації для frontend.
 *
 * @param {Object} user - Користувач.
 * @returns {{ user: Object, token: string }} Дані користувача і JWT.
 */
function createAuthResponse(user) {
  return {
    user,
    token: createToken(user),
  };
}

/**
 * POST /api/auth/register
 *
 * Реєструє нового користувача в PostgreSQL.
 */
router.post("/register", async (req, res, next) => {
  try {
    const {
      login,
      email,
      password,
      firstName = "",
      lastName = "",
    } = req.body;

    if (!isNonEmptyString(login)) {
      throw new AppError(
        "Логін є обов'язковим.",
        400,
        { field: "login" },
        "auth.loginRequired",
      );
    }

    if (!isNonEmptyString(email)) {
      throw new AppError(
        "Email є обов'язковим.",
        400,
        { field: "email" },
        "auth.emailRequired",
      );
    }

    if (!isValidEmail(email.trim())) {
      throw new AppError(
        "Вкажіть коректний email.",
        400,
        { field: "email" },
        "auth.invalidEmail",
      );
    }

    if (!isNonEmptyString(password)) {
      throw new AppError(
        "Пароль є обов'язковим.",
        400,
        { field: "password" },
        "auth.passwordRequired",
      );
    }

    if (password.length < 6) {
      throw new AppError(
        "Пароль має містити щонайменше 6 символів.",
        400,
        { field: "password" },
        "auth.passwordTooShort",
      );
    }

    const normalizedLogin = login.trim();
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await findExistingUser(
      normalizedLogin,
      normalizedEmail,
    );

    if (existingUser) {
      const field =
        existingUser.login === normalizedLogin ? "login" : "email";

      throw new AppError(
        field === "login"
          ? "Користувач з таким логіном вже існує."
          : "Користувач з таким email вже існує.",
        409,
        { field },
        "auth.userAlreadyExists",
      );
    }

    const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

    const user = await createUser({
      login: normalizedLogin,
      email: normalizedEmail,
      passwordHash,
      firstName: isNonEmptyString(firstName) ? firstName.trim() : "",
      lastName: isNonEmptyString(lastName) ? lastName.trim() : "",
      role: "user",
    });

    log.info("User registered", {
      requestId: req.requestId,
      userId: user.id,
      login: user.login,
    });

    return res.status(201).json(createAuthResponse(user));
  } catch (error) {
    if (error.code === "23505") {
      return next(
        new AppError(
          "Користувач з таким логіном або email вже існує.",
          409,
          {},
          "auth.userAlreadyExists",
        ),
      );
    }

    return next(error);
  }
});

/**
 * POST /api/auth/login
 *
 * Авторизує користувача через PostgreSQL.
 */
router.post("/login", async (req, res, next) => {
  try {
    const loginOrEmail = req.body.loginOrEmail || req.body.login;
    const { password } = req.body;

    if (!isNonEmptyString(loginOrEmail)) {
      throw new AppError(
        "Вкажіть логін або email.",
        400,
        { field: "loginOrEmail" },
        "auth.loginOrEmailRequired",
      );
    }

    if (!isNonEmptyString(password)) {
      throw new AppError(
        "Пароль є обов'язковим.",
        400,
        { field: "password" },
        "auth.passwordRequired",
      );
    }

    const userWithPassword = await findUserByLoginOrEmail(
      loginOrEmail.trim(),
    );

    if (!userWithPassword) {
      throw new AppError(
        "Невірний логін/email або пароль.",
        401,
        {},
        "auth.invalidCredentials",
      );
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      userWithPassword.passwordHash,
    );

    if (!isPasswordValid) {
      throw new AppError(
        "Невірний логін/email або пароль.",
        401,
        {},
        "auth.invalidCredentials",
      );
    }

    const user = {
      id: userWithPassword.id,
      login: userWithPassword.login,
      email: userWithPassword.email,
      firstName: userWithPassword.firstName,
      lastName: userWithPassword.lastName,
      role: userWithPassword.role,
      createdAt: userWithPassword.createdAt,
    };

    log.info("User logged in", {
      requestId: req.requestId,
      userId: user.id,
      login: user.login,
    });

    return res.json(createAuthResponse(user));
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/auth/me
 *
 * Повертає дані поточного користувача з JWT.
 */
router.get("/me", async (req, res, next) => {
  try {
    const authorization = req.headers.authorization || "";
    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new AppError(
        "Токен авторизації не передано.",
        401,
        { reason: "NO_TOKEN" },
        "auth.noToken",
      );
    }

    const payload = jwt.verify(token, JWT_SECRET);

    return res.json({
      user: {
        id: String(payload.id),
        login: payload.login,
        email: payload.email,
        firstName: payload.firstName || "",
        lastName: payload.lastName || "",
        role: payload.role || "user",
      },
    });
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return next(
        new AppError(
          "Токен авторизації недійсний або протермінований.",
          401,
          {},
          "auth.invalidToken",
        ),
      );
    }

    return next(error);
  }
});

module.exports = router;