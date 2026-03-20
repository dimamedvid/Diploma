import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../../store/authSlice";
import "./CabinetPage.css";

/**
 * Сторінка особистого кабінету авторизованого користувача.
 *
 * Компонент відображає базовий інтерфейс особистого кабінету
 * та надає можливість завершити поточну сесію.
 *
 * Вихід із акаунту виконується через Redux-дію `logout`,
 * яка очищає стан авторизації та видаляє токен із localStorage.
 * Після цього користувач перенаправляється на сторінку входу.
 *
 * Доступ до цієї сторінки обмежується компонентом `ProtectedRoute`.
 *
 * @returns {JSX.Element} Сторінка особистого кабінету з кнопкою виходу.
 */
export default function CabinetPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  /**
   * Виконує вихід користувача з акаунту.
   *
   * Очищає стан авторизації у Redux store
   * та перенаправляє користувача на сторінку входу.
   *
   * @returns {void}
   */
  const onLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="cabinet">
      <div className="cabinet__card">
        <h1 className="cabinet__title">Особистий кабінет</h1>
        <button className="cabinet__button" type="button" onClick={onLogout}>
          Вийти з акаунту
        </button>
      </div>
    </div>
  );
}