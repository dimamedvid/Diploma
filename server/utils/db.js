const { Pool } = require("pg");
const { createModuleLogger } = require("./logger");

const log = createModuleLogger("db");

/**
 * Пул підключень до PostgreSQL.
 */
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || "ukr_book_db",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
});

/**
 * Виконує SQL-запит до PostgreSQL.
 *
 * @param {string} text - SQL-запит.
 * @param {Array} [params] - Параметри SQL-запиту.
 * @returns {Promise<Object>} Результат виконання запиту.
 */
function query(text, params = []) {
  return pool.query(text, params);
}

/**
 * Виконує кілька SQL-запитів в одній транзакції.
 *
 * Якщо один із запитів впаде, всі зміни відкотяться.
 *
 * @param {Function} callback - Функція, яка отримує client і виконує запити.
 * @returns {Promise<unknown>} Результат callback.
 */
async function transaction(callback) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await callback(client);

    await client.query("COMMIT");

    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Перевіряє підключення до PostgreSQL.
 *
 * @returns {Promise<boolean>} true, якщо підключення успішне.
 */
async function checkDbConnection() {
  try {
    await query("SELECT 1");

    log.info("Database connection checked successfully");

    return true;
  } catch (error) {
    log.error("Database connection check failed", {
      errorMessage: error.message,
    });

    return false;
  }
}

/**
 * Закриває всі підключення пулу.
 *
 * @returns {Promise<void>}
 */
function closePool() {
  return pool.end();
}

module.exports = {
  query,
  transaction,
  checkDbConnection,
  closePool,
};