import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

/**
 * Компонент захисту приватних маршрутів.
 *
 * Перевіряє наявність user і token у Redux store.
 *
 * @param {Object} props - Властивості компонента.
 * @param {JSX.Element} props.children - Вкладений компонент або сторінка.
 * @returns {JSX.Element} Дочірній компонент або перенаправлення на `/login`.
 */
export default function ProtectedRoute({ children }) {
  const { user, token } = useSelector((state) => state.auth);

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}