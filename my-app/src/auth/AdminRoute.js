import { useSelector } from "react-redux";
import { Link, Navigate } from "react-router-dom";

/**
 * Компонент захисту сторінок модерації.
 *
 * Дозволяє доступ тільки користувачам з роллю moderator або admin.
 *
 * @param {Object} props - Властивості компонента.
 * @param {JSX.Element} props.children - Вкладений компонент або сторінка.
 * @returns {JSX.Element} Дочірній компонент, redirect або сторінка заборони доступу.
 */
export default function AdminRoute({ children }) {
  const { user, token } = useSelector((state) => state.auth);

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  if (!["moderator", "admin"].includes(user.role)) {
    return (
      <section className="access-denied">
        <h1 className="access-denied__title">Доступ заборонено</h1>

        <p className="access-denied__text">
          Ця сторінка доступна тільки модератору або адміністратору.
        </p>

        <Link className="access-denied__link" to="/">
          Повернутися на головну
        </Link>
      </section>
    );
  }

  return children;
}