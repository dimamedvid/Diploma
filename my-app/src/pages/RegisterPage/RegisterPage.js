import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../api/authApi";
import { setCredentials } from "../../store/authSlice";
import "./RegisterPage.css";

/**
 * Сторінка реєстрації користувача.
 *
 * Реєстрація виконується через backend PostgreSQL auth.
 *
 * @returns {JSX.Element} Сторінка реєстрації.
 */
export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [login, setLogin] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Реєструє користувача через backend.
   *
   * @param {React.FormEvent<HTMLFormElement>} event - Submit подія.
   * @returns {Promise<void>}
   */
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!login.trim() || !email.trim() || !password.trim()) {
      setError("Заповніть логін, email і пароль.");
      return;
    }

    if (password.length < 6) {
      setError("Пароль має містити щонайменше 6 символів.");
      return;
    }

    if (password !== passwordRepeat) {
      setError("Паролі не збігаються.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const authData = await registerUser({
        login: login.trim(),
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      dispatch(setCredentials(authData));
      navigate("/");
    } catch (registerError) {
      setError(
        registerError.message ||
          "Не вдалося зареєструватися. Перевірте введені дані.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth register-page">
      <section className="auth__card register-page__card">
        <div className="auth__header register-page__header">
          <h1 className="auth__title register-page__title">Реєстрація</h1>

          <p className="auth__subtitle register-page__subtitle">
            Створіть акаунт, щоб додавати власні твори, оцінювати тексти та
            зберігати прогрес читання.
          </p>
        </div>

        <form
          className="auth__form register-page__form"
          onSubmit={handleSubmit}
        >
          {error && (
            <p className="auth__error register-page__error">{error}</p>
          )}

          <label className="auth__field register-page__field">
            <span className="auth__label register-page__label">Логін</span>

            <input
              className="auth__input register-page__input"
              type="text"
              value={login}
              onChange={(event) => setLogin(event.target.value)}
              placeholder="Наприклад: user1"
              disabled={isSubmitting}
            />
          </label>

          <label className="auth__field register-page__field">
            <span className="auth__label register-page__label">Email</span>

            <input
              className="auth__input register-page__input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="user1@gmail.com"
              disabled={isSubmitting}
            />
          </label>

          <div className="auth__row register-page__row">
            <label className="auth__field register-page__field">
              <span className="auth__label register-page__label">
                Ім&apos;я
              </span>

              <input
                className="auth__input register-page__input"
                type="text"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="Ім'я"
                disabled={isSubmitting}
              />
            </label>

            <label className="auth__field register-page__field">
              <span className="auth__label register-page__label">
                Прізвище
              </span>

              <input
                className="auth__input register-page__input"
                type="text"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Прізвище"
                disabled={isSubmitting}
              />
            </label>
          </div>

          <label className="auth__field register-page__field">
            <span className="auth__label register-page__label">Пароль</span>

            <input
              className="auth__input register-page__input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Мінімум 6 символів"
              disabled={isSubmitting}
            />
          </label>

          <label className="auth__field register-page__field">
            <span className="auth__label register-page__label">
              Повторіть пароль
            </span>

            <input
              className="auth__input register-page__input"
              type="password"
              value={passwordRepeat}
              onChange={(event) => setPasswordRepeat(event.target.value)}
              placeholder="Повторіть пароль"
              disabled={isSubmitting}
            />
          </label>

          <button
            className="auth__button register-page__button"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Створюємо акаунт..." : "Зареєструватися"}
          </button>
        </form>

        <p className="auth__footer register-page__footer">
          Уже маєте акаунт?{" "}
          <Link className="auth__link register-page__link" to="/login">
            Увійти
          </Link>
        </p>
      </section>
    </main>
  );
}