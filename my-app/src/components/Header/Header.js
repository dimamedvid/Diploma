import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/authSlice";
import icon from "../../assets/icon.png";
import "./Header.css";

export default function Header() {
  const dispatch = useDispatch();
  const { isLoggedIn, user } = useSelector((s) => s.auth);

  const onLogout = () => {
    dispatch(logout());
  };

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
              <button className="header__button header__button--outline" type="button" onClick={onLogout}>
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
