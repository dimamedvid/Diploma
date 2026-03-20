const request = require("supertest");
const bcrypt = require("bcryptjs");

/**
 * Тимчасове in-memory сховище для емуляції вмісту `users.json`
 * під час інтеграційного тестування.
 *
 * Використовується разом із замоканим модулем `fs`,
 * щоб не змінювати реальні файли на диску.
 *
 * @type {string}
 */
global.__mockUsersJson = "[]";

/**
 * Мок файлової системи для інтеграційних тестів.
 *
 * `readFileSync` повертає поточний JSON-рядок зі змінної
 * `global.__mockUsersJson`, а `writeFileSync` оновлює її значення.
 *
 * Це дозволяє тестувати реальну логіку API поверх файлового сховища,
 * не використовуючи справжній файл `users.json`.
 */
jest.mock("fs", () => ({
  readFileSync: jest.fn(() => global.__mockUsersJson),
  writeFileSync: jest.fn((path, data) => {
    global.__mockUsersJson = data;
  }),
}));

const app = require("../index");

/**
 * Набір інтеграційних тестів для API авторизації.
 *
 * Тести перевіряють повний ланцюжок роботи маршрутів `/api/auth`
 * разом із реальною серверною логікою, JWT, валідацією,
 * файловим сховищем та middleware авторизації.
 *
 * Цей набір тестів можна використовувати як "живу документацію",
 * оскільки він демонструє типові сценарії взаємодії з API:
 * - успішна реєстрація;
 * - обробка дубліката логіна;
 * - помилка входу з неправильним паролем;
 * - доступ до захищеного маршруту без токена;
 * - доступ до захищеного маршруту з валідним токеном;
 * - помилка валідації email.
 */
describe("Integration: /api/auth (mocked JSON storage via fs)", () => {
  /**
   * Перед кожним тестом очищає мок-сховище
   * та скидає всі попередні виклики моків.
   */
  beforeEach(() => {
    global.__mockUsersJson = "[]";
    jest.clearAllMocks();
  });

  /**
   * Перевіряє сценарій успішної реєстрації користувача.
   *
   * Тест підтверджує, що:
   * - сервер повертає статус 200;
   * - у відповіді присутні `token` і `user`;
   * - користувач зберігається у JSON-сховищі;
   * - у сховищі записується `passwordHash`, а не відкритий пароль.
   */
  test("INT_TC_01: POST /api/auth/register, успішна реєстрація", async () => {
    const res = await request(app).post("/api/auth/register").send({
      login: "testuser1",
      firstName: "Test",
      lastName: "User",
      email: "test1@mail.com",
      password: "Password123",
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("user");
    expect(res.body.user.login).toBe("testuser1");

    const saved = JSON.parse(global.__mockUsersJson);
    expect(saved.length).toBe(1);
    expect(saved[0].login).toBe("testuser1");
    expect(saved[0]).toHaveProperty("passwordHash");
  });

  /**
   * Перевіряє, що сервер повертає 409,
   * якщо під час реєстрації використано логін, який уже існує.
   */
  test("INT_TC_02: POST /api/auth/register, дублікат логіну -> 409", async () => {
    global.__mockUsersJson = JSON.stringify(
      [
        {
          id: "u1",
          login: "testuser2",
          firstName: "A",
          lastName: "B",
          email: "a@mail.com",
          passwordHash: await bcrypt.hash("Password123", 10),
          role: "user",
          createdAt: new Date().toISOString(),
        },
      ],
      null,
      2,
    );

    const res = await request(app).post("/api/auth/register").send({
      login: "testuser2",
      firstName: "Test",
      lastName: "User",
      email: "test2@mail.com",
      password: "Password123",
    });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty("message");
  });

  /**
   * Перевіряє, що сервер повертає 401,
   * якщо користувач вводить неправильний пароль під час входу.
   */
  test("INT_TC_03: POST /api/auth/login, неправильний пароль -> 401", async () => {
    global.__mockUsersJson = JSON.stringify(
      [
        {
          id: "u3",
          login: "testuser3",
          firstName: "T",
          lastName: "U",
          email: "test3@mail.com",
          passwordHash: await bcrypt.hash("Password123", 10),
          role: "user",
          createdAt: new Date().toISOString(),
        },
      ],
      null,
      2,
    );

    const res = await request(app).post("/api/auth/login").send({
      login: "testuser3",
      password: "WrongPass123",
    });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message", "Невірний логін або пароль.");
  });

  /**
   * Перевіряє, що захищений маршрут `/api/auth/me`
   * повертає 401, якщо токен авторизації не передано.
   */
  test("INT_TC_04: GET /api/auth/me без токена -> 401", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message", "No token");
  });

  /**
   * Перевіряє сценарій успішного доступу до `/api/auth/me`
   * з валідним токеном, отриманим після реєстрації.
   */
  test("INT_TC_05: GET /api/auth/me з валідним токеном -> 200", async () => {
    const reg = await request(app).post("/api/auth/register").send({
      login: "testuser5",
      firstName: "Test",
      lastName: "User",
      email: "test5@mail.com",
      password: "Password123",
    });

    const token = reg.body.token;
    expect(token).toBeTruthy();

    const me = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(me.status).toBe(200);
    expect(me.body).toHaveProperty("user");
    expect(me.body.user).toHaveProperty("login", "testuser5");
  });

  /**
   * Перевіряє, що сервер повертає 400,
   * якщо під час реєстрації передано некоректний email.
   */
  test("INT_TC_06: POST /api/auth/register з некоректним email -> 400", async () => {
    const res = await request(app).post("/api/auth/register").send({
      login: "bademailuser",
      firstName: "Test",
      lastName: "User",
      email: "not-an-email",
      password: "Password123",
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message", "Email має бути у форматі name@mail.com.");
  });
});