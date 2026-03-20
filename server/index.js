const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");

/**
 * Основний Express-застосунок серверної частини.
 *
 * Сервер відповідає за:
 * - обробку HTTP-запитів;
 * - підключення middleware;
 * - маршрутизацію API авторизації;
 * - health-check endpoint для перевірки доступності сервера.
 */
const app = express();

/**
 * Middleware для налаштування CORS.
 *
 * Дозволяє клієнтському застосунку з адреси `http://localhost:3000`
 * виконувати запити до backend API.
 */
app.use(cors({ origin: "http://localhost:3000", credentials: false }));

/**
 * Middleware для автоматичного розбору JSON у тілі запиту.
 *
 * Дозволяє працювати з `req.body` як зі звичайним JavaScript-об'єктом.
 */
app.use(express.json());

/**
 * Підключення маршрутів авторизації.
 *
 * Усі маршрути з модуля `auth.routes` доступні з префіксом `/api/auth`.
 */
app.use("/api/auth", authRoutes);

/**
 * GET /api/health
 *
 * Технічний endpoint для перевірки доступності сервера.
 * Використовується для health-check, тестування та перевірки,
 * чи backend запущений і може відповідати на запити.
 *
 * @param {Object} req - HTTP-запит Express.
 * @param {Object} res - HTTP-відповідь Express.
 * @returns {Object} JSON-об'єкт зі статусом доступності сервера.
 */
app.get("/api/health", (req, res) => res.json({ ok: true }));

/**
 * Запускає HTTP-сервер, якщо файл виконано напряму.
 *
 * Під час імпорту модуля в тести сервер не запускається автоматично,
 * що дозволяє використовувати `app` у test environment без відкриття порту.
 */
if (require.main === module) {
  const PORT = 4000;
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
}

/**
 * Експорт Express-застосунку для тестування та повторного використання.
 */
module.exports = app;