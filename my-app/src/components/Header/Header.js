import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/authSlice";
import icon from "../../assets/icon.png";
import "./Header.css";

/**
 * Верхня панель навігації застосунку.
 *
 * @returns {JSX.Element} Верхня панель навігації.
 */
export default function Header() {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);

  const isLoggedIn = Boolean(user && token);
  const isModerator = ["moderator", "admin"].includes(user?.role);

  /**
   * Виконує вихід користувача з акаунту.
   *
   * @returns {void}
   */
  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <header className="header">
      <div className="container header__inner">
        <Link className="header__logo" to="/">
          <img src={icon} alt="Ukr-Book logo" />
          <h1>Ukr-Book</h1>
        </Link>

        <nav className="header__nav">
          <ul className="header__items">
            <li>
              <Link className="header__link" to="/">
                Головна
              </Link>
            </li>

            {isLoggedIn && (
              <li>
                <Link className="header__link" to="/works/create">
                  Додати твір
                </Link>
              </li>
            )}

            {isLoggedIn && isModerator && (
              <>
                <li>
                  <Link className="header__link" to="/admin">
                    Модерація
                  </Link>
                </li>

                <li>
                  <Link className="header__link" to="/admin/stats">
                    Статистика
                  </Link>
                </li>
              </>
            )}
          </ul>
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
                onClick={handleLogout}
              >
                Вийти
              </button>
            </>
          ) : (
            <>
              <Link className="header__button header__button--outline" to="/login">
                Увійти
              </Link>

              <Link className="header__button" to="/register">
                Реєстрація
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}