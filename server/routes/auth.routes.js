const express = require("express");
const bcrypt = require("bcryptjs");
const { readUsers, writeUsers } = require("../utils/fileDb");
const { signToken } = require("../utils/jwt");
const { authMiddleware } = require("../middlewares/auth.middleware");

const router = express.Router();

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isEmailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isLoginValid(login) {
  return /^[a-zA-Z0-9]{4,25}$/.test(login);
}

function isPasswordValid(password) {
  return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$/.test(password);
}

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
    (u) => String(u.login || "").trim().toLowerCase() === login.toLowerCase()
  );
  if (loginExists) return res.status(409).json({ message: "Такий логін вже зайнятий." });

  const emailExists = users.some((u) => normalizeEmail(u.email) === email);
  if (emailExists) return res.status(409).json({ message: "Такий email вже зареєстрований." });

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

router.post("/login", async (req, res) => {
  const loginInput = String(req.body.login || "").trim();
  const password = String(req.body.password || "");

  if (!loginInput || !password) {
    return res.status(400).json({ message: "Будь ласка, введіть логін і пароль." });
  }

  const users = readUsers();

  let user = users.find(
    (u) => String(u.login || "").trim().toLowerCase() === loginInput.toLowerCase()
  );

  if (!user) {
    const asEmail = normalizeEmail(loginInput);
    user = users.find((u) => normalizeEmail(u.email) === asEmail);
  }

  if (!user) return res.status(401).json({ message: "Невірний логін або пароль." });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Невірний логін або пароль." });

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

router.get("/me", authMiddleware, (req, res) => {
  return res.json({ user: req.user });
});

module.exports = router;
