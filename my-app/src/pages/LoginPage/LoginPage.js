import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, clearAuthError } from "../../store/authSlice";
import UserErrorMessage from "../../components/UserErrorMessage/UserErrorMessage";
import "./LoginPage.css";

/**
 * Сторінка входу користувача в систему.
 *
 * Компонент відображає форму авторизації, дозволяє користувачу
 * ввести логін і пароль, а також виконує вхід через Redux thunk
 * `loginUser`.
 *
 * Під час введення даних попереднє повідомлення про помилку
 * очищується через `clearAuthError`. Після успішної авторизації
 * користувач перенаправляється на головну сторінку.
 *
 * Стан компонента включає:
 * - локальний стан форми входу;
 * - глобальний стан авторизації з Redux store;
 * - статус виконання запиту та текст/об’єкт помилки.
 *
 * @returns {JSX.Element} Сторінка входу з формою авторизації.
 */
export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((s) => s.auth);

  /**
   * Локальний стан форми входу.
   *
   * Містить значення полів логіна та пароля.
   */
  const [form, setForm] = useState({ login: "", password: "" });

  /**
   * Нормалізує серверну помилку до формату,
   * який очікує компонент `UserErrorMessage`.
   *
   * Якщо в Redux store зберігається лише рядок,
   * він також буде коректно відображений.
   */
  const normalizedError =
    typeof error === "string"
      ? {
        success: false,
        message: error,
        messageKey: "",
        errorId: null,
        requestId: null,
        details: {},
      }
      : error;

  /**
   * Обробляє зміну значень полів форми.
   *
   * Під час кожного введення:
   * - очищає попередню помилку авторизації;
   * - оновлює відповідне поле у локальному стані форми.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - Подія зміни поля вводу.
   * @returns {void}
   */
  const onChange = (e) => {
    dispatch(clearAuthError());
    const { name, value } = e.target;
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
  };

  /**
   * Обробляє відправлення форми входу.
   *
   * Скасовує стандартну поведінку форми, запускає асинхронний
   * thunk `loginUser` і після успішної авторизації
   * перенаправляє користувача на головну сторінку.
   *
   * @async
   * @param {React.FormEvent<HTMLFormElement>} e - Подія відправлення форми.
   * @returns {Promise<void>}
   */
  const onSubmit = async (e) => {
    e.preventDefault();

    const result = await dispatch(loginUser(form));

    if (result.type.endsWith("fulfilled")) {
      navigate("/");
    }
  };

  return (
    <div className="auth auth--login">
      <div className="auth__card">
        <h1 className="auth__title">Вхід</h1>

        <form className="auth__form" onSubmit={onSubmit}>
          <label className="auth__field">
            <span className="auth__label">Логін</span>
            <input
              className="auth__input"
              name="login"
              value={form.login}
              onChange={onChange}
              required
            />
          </label>

          <label className="auth__field">
            <span className="auth__label">Пароль</span>
            <input
              className="auth__input"
              type="password"
              name="password"
              value={form.password}
              onChange={onChange}
              required
            />
          </label>

          <UserErrorMessage error={normalizedError} />

          <button className="auth__button" type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Входжу..." : "Увійти"}
          </button>
        </form>

        <p className="auth__hint">
          Немає акаунту?{" "}
          <Link className="auth__link" to="/register">
            Зареєструватися
          </Link>
        </p>
      </div>
    </div>
  );
}