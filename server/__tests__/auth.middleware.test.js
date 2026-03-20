jest.mock("../utils/jwt", () => ({
  verifyToken: jest.fn(),
  signToken: jest.fn(),
}));

const { verifyToken } = require("../utils/jwt");
const { authMiddleware } = require("../middlewares/auth.middleware");

/**
 * Створює тестовий об'єкт HTTP-відповіді Express.
 *
 * Використовується для перевірки викликів `status()` і `json()`
 * у middleware авторизації.
 *
 * @returns {{status: Function, json: Function}} Мок-об'єкт відповіді Express.
 */
function makeRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

/**
 * Набір unit-тестів для middleware авторизації `authMiddleware`.
 *
 * Тести перевіряють основні сценарії роботи middleware:
 * - відсутність заголовка Authorization;
 * - невалідний JWT-токен;
 * - валідний JWT-токен.
 *
 * Ці тести виступають прикладом "живої документації",
 * оскільки формально описують очікувану поведінку
 * захищених маршрутів API при різних варіантах авторизації.
 */
describe("authMiddleware", () => {
  /**
   * Перед кожним тестом очищає всі моки,
   * щоб забезпечити незалежність тестових сценаріїв.
   */
  beforeEach(() => jest.clearAllMocks());

  /**
   * Перевіряє, що middleware повертає 401,
   * якщо заголовок Authorization відсутній.
   *
   * Також перевіряється, що функція `next` не викликається,
   * оскільки доступ до захищеного маршруту має бути заборонений.
   */
  test("401 when missing Authorization header", () => {
    const req = { headers: {} };
    const res = makeRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "No token" });
    expect(next).not.toHaveBeenCalled();
  });

  /**
   * Перевіряє, що middleware повертає 401,
   * якщо переданий токен недійсний.
   *
   * Для цього мок `verifyToken` викидає помилку,
   * яка імітує ситуацію з неправильним або пошкодженим JWT.
   */
  test("401 when token invalid", () => {
    verifyToken.mockImplementation(() => {
      throw new Error("bad token");
    });

    const req = { headers: { authorization: "Bearer BAD" } };
    const res = makeRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid token" });
    expect(next).not.toHaveBeenCalled();
  });

  /**
   * Перевіряє, що middleware:
   * - записує декодований payload токена у `req.user`;
   * - викликає `next()`,
   * якщо токен валідний.
   */
  test("sets req.user and calls next when token valid", () => {
    verifyToken.mockReturnValue({ id: "1", login: "user123", role: "user" });

    const req = { headers: { authorization: "Bearer GOOD" } };
    const res = makeRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(req.user).toEqual({ id: "1", login: "user123", role: "user" });
    expect(next).toHaveBeenCalledTimes(1);
  });
});