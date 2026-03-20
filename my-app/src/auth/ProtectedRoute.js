import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

/**
 * Захищає приватні маршрути застосунку від неавторизованого доступу.
 *
 * Компонент перевіряє стан авторизації у Redux store.
 * Якщо користувач увійшов у систему, відображається вкладений компонент.
 * Якщо ні, виконується перенаправлення на сторінку входу.
 *
 * @param {Object} props - Властивості компонента.
 * @param {JSX.Element} props.children - Вкладений компонент або сторінка.
 * @returns {JSX.Element} Дочірній компонент або Navigate на /login.
 */
export default function ProtectedRoute({ children }) {
  const isLoggedIn = useSelector((s) => s.auth.isLoggedIn);
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}