import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { registerUser, clearAuthError } from "../../store/authSlice";
import "./RegisterPage.css";

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((s) => s.auth);

  const [form, setForm] = useState({
    login: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [localError, setLocalError] = useState("");

  const onChange = (e) => {
    dispatch(clearAuthError());
    setLocalError("");
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

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

  const onSubmit = async (e) => {
    e.preventDefault();

    const msg = validate();
    if (msg) {
      setLocalError(msg);
      return;
    }

    const res = await dispatch(
      registerUser({
        login: form.login,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
      })
    );

    if (res.type.endsWith("fulfilled")) navigate("/");
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

          {localError && <p className="auth__error">{localError}</p>}
          {error && <p className="auth__error">{error}</p>}

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
