import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../../api/authApi";
import { setCredentials } from "../../store/authSlice";
import "./LoginPage.css";

/**
 * Сторінка входу користувача.
 *
 * Авторизація виконується через backend PostgreSQL auth.
 *
 * @returns {JSX.Element} Сторінка входу.
 */
export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [loginOrEmail, setLoginOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Авторизує користувача через backend.
   *
   * @param {React.FormEvent<HTMLFormElement>} event - Submit подія.
   * @returns {Promise<void>}
   */
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!loginOrEmail.trim() || !password.trim()) {
      setError("Вкажіть логін/email і пароль.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const authData = await loginUser({
        loginOrEmail: loginOrEmail.trim(),
        password,
      });

      dispatch(setCredentials(authData));
      navigate("/");
    } catch (loginError) {
      setError(
        loginError.message ||
          "Не вдалося увійти. Перевірте логін/email і пароль.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth login-page">
      <section className="auth__card login-page__card">
        <div className="auth__header login-page__header">
          <h1 className="auth__title login-page__title">Вхід</h1>

          <p className="auth__subtitle login-page__subtitle">
            Увійдіть у свій акаунт, щоб додавати твори, коментарі та зберігати
            прогрес читання.
          </p>
        </div>

        <form className="auth__form login-page__form" onSubmit={handleSubmit}>
          {error && <p className="auth__error login-page__error">{error}</p>}

          <label className="auth__field login-page__field">
            <span className="auth__label login-page__label">
              Логін або email
            </span>

            <input
              className="auth__input login-page__input"
              type="text"
              value={loginOrEmail}
              onChange={(event) => setLoginOrEmail(event.target.value)}
              placeholder="user1 або user1@gmail.com"
              disabled={isSubmitting}
            />
          </label>

          <label className="auth__field login-page__field">
            <span className="auth__label login-page__label">Пароль</span>

            <input
              className="auth__input login-page__input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Ваш пароль"
              disabled={isSubmitting}
            />
          </label>

          <button
            className="auth__button login-page__button"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Входимо..." : "Увійти"}
          </button>
        </form>

        <p className="auth__footer login-page__footer">
          Ще немає акаунта?{" "}
          <Link className="auth__link login-page__link" to="/register">
            Зареєструватися
          </Link>
        </p>
      </section>
    </main>
  );
}