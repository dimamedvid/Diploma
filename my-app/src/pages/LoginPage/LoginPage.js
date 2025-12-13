import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, clearAuthError } from "../../store/authSlice";
import "./LoginPage.css";

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((s) => s.auth);

  const [form, setForm] = useState({ login: "", password: "" });

  const onChange = (e) => {
    dispatch(clearAuthError());
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const res = await dispatch(loginUser(form));
    if (res.type.endsWith("fulfilled")) navigate("/");
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

          {error && <p className="auth__error">{error}</p>}

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
