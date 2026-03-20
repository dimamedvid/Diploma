import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/authSlice";
import icon from "../../assets/icon.png";
import "./Header.css";

/**
 * Верхня панель навігації застосунку.
 *
 * Компонент відображає:
 * - логотип і назву системи;
 * - основну навігацію;
 * - кнопки входу, реєстрації, переходу в особистий кабінет;
 * - кнопку виходу з акаунту.
 *
 * Вміст шапки залежить від стану авторизації користувача.
 * Якщо користувач увійшов у систему, показуються кнопки
 * для переходу до кабінету та виходу.
 * Якщо користувач не авторизований, показуються кнопки
 * входу та реєстрації.
 *
 * Якщо авторизований користувач має роль `moderator`,
 * додатково відображається посилання на сторінку модерації.
 *
 * @returns {JSX.Element} Верхня панель навігації застосунку.
 */
export default function Header() {
  const dispatch = useDispatch();
  const { isLoggedIn, user } = useSelector((s) => s.auth);

  /**
   * Виконує вихід користувача з акаунту.
   *
   * Очищає стан авторизації у Redux store
   * та прибирає збережені дані сесії.
   *
   * @returns {void}
   */
  const onLogout = () => {
    dispatch(logout());
  };

  /**
   * Прапорець, який визначає, чи є поточний користувач модератором.
   *
   * @type {boolean}
   */
  const isModerator = isLoggedIn && user?.role === "moderator";

  return (
    <header className="header">
      <div className="container header__inner">
        <Link to="/" className="header__logo" aria-label="Перейти на головну">
          <img className="header__icon" src={icon} alt="Ukr-Book logo" />
          <h1 className="header__title">Ukr-Book</h1>
        </Link>

        <nav className="header__nav" aria-label="Головна навігація">
          {isModerator && (
            <Link className="header__link" to="/admin">
              Модерація
            </Link>
          )}
        </nav>

        <div className="header__auth">
          {isLoggedIn ? (
            <>
              <Link className="header__button" to="/cabinet">
                Особистий кабінет
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
              <Link className="header__button header__button--outline" to="/register">
                Реєстрація
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}