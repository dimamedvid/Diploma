import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

/**
 * Компонент захисту приватних маршрутів.
 *
 * Використовується для обмеження доступу до сторінок,
 * які доступні лише авторизованим користувачам.
 * Перевіряє прапорець `isLoggedIn` у Redux store.
 *
 * Якщо користувач авторизований, компонент повертає
 * вкладений елемент маршруту. Якщо ні, виконується
 * перенаправлення на сторінку входу.
 *
 * @param {Object} props - Властивості компонента.
 * @param {JSX.Element} props.children - Вкладений компонент або сторінка.
 * @returns {JSX.Element} Дочірній компонент або перенаправлення на `/login`.
 */
export default function ProtectedRoute({ children }) {
  const isLoggedIn = useSelector((s) => s.auth.isLoggedIn);
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}