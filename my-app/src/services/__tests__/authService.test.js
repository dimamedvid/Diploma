import { login, register, me } from "../authService";

/**
 * Набір unit-тестів для модуля authService.
 *
 * Тести перевіряють коректність взаємодії клієнтського сервісу
 * авторизації з backend API, а саме:
 * - правильність формування POST-запиту на реєстрацію;
 * - коректну обробку помилки під час входу;
 * - передачу Bearer-токена при запиті даних поточного користувача.
 *
 * Ці тести виступають прикладом "живої документації",
 * оскільки описують очікувану поведінку публічних функцій
 * `register`, `login` і `me`.
 */
describe("authService (register/login/me)", () => {
  /**
   * Перед кожним тестом підміняє глобальний `fetch`
   * мок-функцією для ізольованого тестування HTTP-запитів.
   */
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  /**
   * Після кожного тесту очищає всі моки,
   * щоб уникнути впливу попередніх тестів на наступні.
   */
  afterEach(() => {
    jest.resetAllMocks();
  });

  /**
   * Перевіряє, що функція `register`:
   * - надсилає POST-запит на правильний endpoint;
   * - встановлює заголовок `Content-Type: application/json`;
   * - передає в тілі запиту коректні дані користувача.
   */
  test("register sends POST /api/auth/register with JSON body", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ token: "t", user: { id: "1" } }),
    });

    await register({
      login: "user123",
      firstName: "A",
      lastName: "B",
      email: "a@a.com",
      password: "Passw0rd",
    });

    const [url, opts] = fetch.mock.calls[0];
    expect(url).toMatch(/http:\/\/localhost:4000\/api\/auth\/register$/);
    expect(opts.method).toBe("POST");
    expect(opts.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(opts.body)).toEqual({
      login: "user123",
      firstName: "A",
      lastName: "B",
      email: "a@a.com",
      password: "Passw0rd",
    });
  });

  /**
   * Перевіряє, що функція `login` коректно перетворює
   * неуспішну HTTP-відповідь на JavaScript-помилку
   * з текстом, отриманим від сервера.
   */
  test("login throws Error(message) when response not ok", async () => {
    fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Невірний логін або пароль." }),
    });

    await expect(login({ login: "user123", password: "wrong" })).rejects.toThrow(
      "Невірний логін або пароль.",
    );
  });

  /**
   * Перевіряє, що функція `me`:
   * - викликає правильний endpoint;
   * - додає заголовок `Authorization`
   *   у форматі `Bearer <token>`.
   */
  test("me sends Authorization Bearer token", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ user: { id: "1" } }),
    });

    await me("TOKEN123");

    const [url, opts] = fetch.mock.calls[0];
    expect(url).toMatch(/http:\/\/localhost:4000\/api\/auth\/me$/);
    expect(opts.headers.Authorization).toBe("Bearer TOKEN123");
  });
});