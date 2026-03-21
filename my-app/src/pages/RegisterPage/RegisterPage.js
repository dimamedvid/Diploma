import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { registerUser, clearAuthError } from "../../store/authSlice";
import UserErrorMessage from "../../components/UserErrorMessage/UserErrorMessage";
import "./RegisterPage.css";

/**
 * Сторінка реєстрації нового користувача.
 *
 * Компонент відображає форму створення облікового запису,
 * виконує клієнтську валідацію полів і після успішної
 * реєстрації перенаправляє користувача на головну сторінку.
 *
 * Також компонент працює з глобальним станом авторизації:
 * - отримує статус запиту;
 * - відображає помилки з Redux store;
 * - очищає попередні повідомлення про помилки при зміні полів.
 *
 * @returns {JSX.Element} Сторінка реєстрації з формою створення акаунта.
 */
export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((s) => s.auth);

  /**
   * Локальний стан форми реєстрації.
   *
   * Містить значення всіх полів, необхідних для створення облікового запису,
   * включно з повторним введенням пароля для перевірки збігу.
   */
  const [form, setForm] = useState({
    login: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  /**
   * Локальне повідомлення про помилку клієнтської валідації.
   *
   * Використовується для відображення помилок ще до надсилання
   * запиту на сервер, наприклад при незаповнених полях
   * або невідповідності паролів.
   */
  const [localError, setLocalError] = useState("");

  /**
   * Нормалізує серверну помилку до формату,
   * який очікує компонент `UserErrorMessage`.
   */
  const normalizedServerError =
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
   * Нормалізує локальну клієнтську помилку валідації.
   *
   * Так ми можемо показувати її тим самим компонентом,
   * що й серверні помилки.
   */
  const normalizedLocalError = localError
    ? {
      success: false,
      message: localError,
      messageKey: "",
      errorId: null,
      requestId: null,
      details: {},
    }
    : null;

  /**
   * Обробляє зміну значень полів форми.
   *
   * Під час кожного введення:
   * - очищає серверну помилку авторизації;
   * - очищає локальну помилку валідації;
   * - оновлює відповідне поле у стані форми.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - Подія зміни поля вводу.
   * @returns {void}
   */
  const onChange = (e) => {
    dispatch(clearAuthError());
    setLocalError("");

    const { name, value } = e.target;
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
  };

  /**
   * Виконує клієнтську валідацію форми реєстрації.
   *
   * Перевіряє:
   * - заповнення всіх обов'язкових полів;
   * - формат логіна;
   * - довжину імені та прізвища;
   * - формат email;
   * - складність пароля;
   * - збіг пароля і підтвердження пароля.
   *
   * @returns {string} Порожній рядок, якщо форма коректна,
   * або текст повідомлення про помилку.
   */
  const validate = () => {
    if (
      !form.login ||
      !form.firstName ||
      !form.lastName ||
      !form.email ||
      !form.password ||
      !form.confirmPassword
    ) {
      return "Будь ласка, заповніть усі обов’язкові поля.";
    }

    if (!/^[a-zA-Z0-9]{4,25}$/.test(form.login)) {
      return "Логін: 4–25 символів, латинські літери/цифри.";
    }

    if (form.firstName.length < 1 || form.firstName.length > 50) {
      return "Ім’я: 1–50 символів.";
    }

    if (form.lastName.length < 1 || form.lastName.length > 50) {
      return "Прізвище: 1–50 символів.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return "Email має бути у форматі name@mail.com.";
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$/.test(form.password)) {
      return "Пароль: 8–20 символів, мінімум 1 літера і 1 цифра.";
    }

    if (form.password !== form.confirmPassword) {
      return "Паролі не співпадають.";
    }

    return "";
  };

  /**
   * Обробляє відправлення форми реєстрації.
   *
   * Спочатку виконує клієнтську валідацію. Якщо форма не проходить перевірку,
   * показує повідомлення про помилку і не надсилає запит на сервер.
   *
   * Якщо форма валідна, запускає Redux thunk `registerUser`.
   * Після успішної реєстрації перенаправляє користувача
   * на головну сторінку застосунку.
   *
   * @async
   * @param {React.FormEvent<HTMLFormElement>} e - Подія відправлення форми.
   * @returns {Promise<void>}
   */
  const onSubmit = async (e) => {
    e.preventDefault();

    const validationMessage = validate();
    if (validationMessage) {
      setLocalError(validationMessage);
      return;
    }

    const result = await dispatch(
      registerUser({
        login: form.login,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
      }),
    );

    if (result.type.endsWith("fulfilled")) {
      navigate("/");
    }
  };

  return (
    <div className="auth auth--register">
      <div className="auth__card">
        <h1 className="auth__title">Реєстрація</h1>

        <form className="auth__form" onSubmit={onSubmit}>
          <label className="auth__field">
            <span className="auth__label">Логін *</span>
            <input
              className="auth__input"
              name="login"
              value={form.login}
              onChange={onChange}
              required
            />
          </label>

          <label className="auth__field">
            <span className="auth__label">Ім’я *</span>
            <input
              className="auth__input"
              name="firstName"
              value={form.firstName}
              onChange={onChange}
              required
            />
          </label>

          <label className="auth__field">
            <span className="auth__label">Прізвище *</span>
            <input
              className="auth__input"
              name="lastName"
              value={form.lastName}
              onChange={onChange}
              required
            />
          </label>

          <label className="auth__field">
            <span className="auth__label">Email *</span>
            <input
              className="auth__input"
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              required
            />
          </label>

          <label className="auth__field">
            <span className="auth__label">Пароль *</span>
            <input
              className="auth__input"
              type="password"
              name="password"
              value={form.password}
              onChange={onChange}
              required
            />
          </label>

          <label className="auth__field">
            <span className="auth__label">Повторіть пароль *</span>
            <input
              className="auth__input"
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={onChange}
              required
            />
          </label>

          <UserErrorMessage error={normalizedLocalError || normalizedServerError} />

          <button className="auth__button" type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Реєструю..." : "Зареєструватися"}
          </button>
        </form>

        <p className="auth__hint">
          Вже є акаунт?{" "}
          <Link className="auth__link" to="/login">
            Увійти
          </Link>
        </p>
      </div>
    </div>
  );
}