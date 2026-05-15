import { useSelector } from "react-redux";
import { Link, Navigate } from "react-router-dom";

/**
 * Перевіряє, чи має користувач доступ до адмін-панелі.
 *
 * @param {Object|null} user - Дані поточного користувача.
 * @returns {boolean} true, якщо користувач є адміністратором або модератором.
 */
function hasAdminAccess(user) {
  return user?.role === "admin" || user?.role === "moderator";
}

/**
 * Захищений маршрут для сторінки адміністратора або модератора.
 *
 * Якщо користувач не авторизований, виконується перенаправлення на сторінку входу.
 * Якщо користувач не має потрібної ролі, показується повідомлення про заборону доступу.
 *
 * @param {{ children: JSX.Element }} props - Властивості компонента.
 * @returns {JSX.Element} Захищена сторінка або повідомлення про відсутність доступу.
 */
export default function AdminRoute({ children }) {
  const { isLoggedIn, user } = useSelector((state) => state.auth);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (!hasAdminAccess(user)) {
    return (
      <section className="access-denied">
        <h1 className="access-denied__title">Доступ заборонено</h1>

        <p className="access-denied__text">
          Ця сторінка доступна лише користувачам з роллю адміністратора або
          модератора.
        </p>

        <Link className="access-denied__link" to="/">
          Повернутися на головну
        </Link>
      </section>
    );
  }

  return children;
}