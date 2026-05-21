const { query } = require("./db");

/**
 * Перетворює користувача з PostgreSQL у формат для frontend/JWT.
 *
 * @param {Object} row - Запис користувача з БД.
 * @returns {Object} Користувач без password_hash.
 */
function mapUserRow(row) {
  return {
    id: String(row.id),
    login: row.login,
    email: row.email,
    firstName: row.first_name || "",
    lastName: row.last_name || "",
    role: row.role,
    createdAt: row.created_at,
  };
}

/**
 * Створює нового користувача.
 *
 * @param {Object} userData - Дані користувача.
 * @param {string} userData.login - Логін.
 * @param {string} userData.email - Email.
 * @param {string} userData.passwordHash - Hash пароля.
 * @param {string} userData.firstName - Ім'я.
 * @param {string} userData.lastName - Прізвище.
 * @param {string} userData.role - Роль.
 * @returns {Promise<Object>} Створений користувач.
 */
async function createUser(userData) {
  const {
    login,
    email,
    passwordHash,
    firstName,
    lastName,
    role = "user",
  } = userData;

  const result = await query(
    `
      INSERT INTO users (
        login,
        email,
        password_hash,
        first_name,
        last_name,
        role
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        login,
        email,
        first_name,
        last_name,
        role,
        created_at
    `,
    [
      login,
      email,
      passwordHash,
      firstName,
      lastName,
      role,
    ],
  );

  return mapUserRow(result.rows[0]);
}

/**
 * Шукає користувача за login або email.
 *
 * Повертає password_hash, бо використовується для login.
 *
 * @param {string} loginOrEmail - Логін або email.
 * @returns {Promise<Object|null>} Користувач з password_hash або null.
 */
async function findUserByLoginOrEmail(loginOrEmail) {
  const result = await query(
    `
      SELECT
        id,
        login,
        email,
        password_hash,
        first_name,
        last_name,
        role,
        created_at
      FROM users
      WHERE login = $1 OR email = $1
      LIMIT 1
    `,
    [loginOrEmail],
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];

  return {
    ...mapUserRow(row),
    passwordHash: row.password_hash,
  };
}

/**
 * Шукає користувача за ID.
 *
 * @param {number|string} userId - ID користувача.
 * @returns {Promise<Object|null>} Користувач або null.
 */
async function findUserById(userId) {
  const result = await query(
    `
      SELECT
        id,
        login,
        email,
        first_name,
        last_name,
        role,
        created_at
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [userId],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapUserRow(result.rows[0]);
}

/**
 * Перевіряє, чи існує користувач з таким login або email.
 *
 * @param {string} login - Логін.
 * @param {string} email - Email.
 * @returns {Promise<Object|null>} Знайдений користувач або null.
 */
async function findExistingUser(login, email) {
  const result = await query(
    `
      SELECT
        id,
        login,
        email
      FROM users
      WHERE login = $1 OR email = $2
      LIMIT 1
    `,
    [login, email],
  );

  return result.rows[0] || null;
}

module.exports = {
  createUser,
  findUserByLoginOrEmail,
  findUserById,
  findExistingUser,
};