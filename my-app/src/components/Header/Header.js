import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/authSlice";
import icon from "../../assets/icon.png";
import "./Header.css";

/**
 * Перевіряє, чи користувач має доступ до сторінок модерації.
 *
 * @param {Object|null} user - Дані поточного користувача.
 * @returns {boolean} true, якщо користувач є адміністратором або модератором.
 */
function canUserModerate(user) {
  return user?.role === "admin" || user?.role === "moderator";
}

/**
 * Верхня панель навігації застосунку.
 *
 * Відображає логотип, основні посилання, кнопки авторизації,
 * кабінет користувача, модерацію та статистику для користувачів
 * з відповідною роллю.
 *
 * @returns {JSX.Element} Header застосунку.
 */
export default function Header() {
  const dispatch = useDispatch();
  const { isLoggedIn, user } = useSelector((state) => state.auth);
  const canModerate = canUserModerate(user);

  /**
   * Виконує вихід користувача з акаунту.
   *
   * @returns {void}
   */
  const onLogout = () => {
    dispatch(logout());
  };

  return (
    <header className="header">
      <div className="container header__inner">
        <Link className="header__logo" to="/">
          <img src={icon} alt="Ukr-Book logo" width="40" height="40" />
          <h1>Ukr-Book</h1>
        </Link>

        <nav className="header__nav">
          <Link className="header__link" to="/">
            Головна
          </Link>

          {canModerate && (
            <>
              <Link className="header__link" to="/admin">
                Модерація
              </Link>

              <Link className="header__link" to="/admin/stats">
                Статистика
              </Link>
            </>
          )}
        </nav>

        <div className="header__auth">
          {isLoggedIn ? (
            <>
              <Link className="header__button" to="/cabinet">
                Кабінет
              </Link>

              <button
                className="header__button header__button--outline"
                type="button"
                onClick={onLogout}
              >
                Вийти
              </button>
            </>
          ) : (
            <>
              <Link className="header__button" to="/login">
                Увійти
              </Link>

              <Link
                className="header__button header__button--outline"
                to="/register"
              >
                Реєстрація
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}