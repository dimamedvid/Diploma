import { Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage/HomePage";
import LoginPage from "./pages/LoginPage/LoginPage";
import RegisterPage from "./pages/RegisterPage/RegisterPage";
import CabinetPage from "./pages/CabinetPage/CabinetPage";
import Header from "./components/Header/Header";
import AdminPage from "./pages/AdminPage/AdminPage";
import Footer from "./components/Footer/Footer";
import ProtectedRoute from "./auth/ProtectedRoute";
import NotFoundPage from "./pages/NotFoundPage/NotFoundPage";
import "./App.css";

/**
 * Кореневий компонент клієнтської частини застосунку.
 *
 * Формує загальну структуру сторінки, яка включає:
 * - шапку сайту;
 * - основну область контенту;
 * - підвал сайту.
 *
 * Компонент також налаштовує маршрутизацію між сторінками застосунку
 * за допомогою `react-router-dom`.
 *
 * Доступні маршрути:
 * - `/` — головна сторінка з каталогом творів;
 * - `/admin` — сторінка адміністратора;
 * - `/login` — сторінка входу;
 * - `/register` — сторінка реєстрації;
 * - `/cabinet` — особистий кабінет користувача, доступний лише після авторизації;
 * - `*` — сторінка 404 для невідомих маршрутів.
 *
 * Для захисту приватного маршруту `/cabinet` використовується компонент
 * `ProtectedRoute`, який перевіряє, чи користувач авторизований.
 *
 * @returns {JSX.Element} Кореневий компонент із маршрутизацією та спільним layout.
 */
export default function App() {
  return (
    <div className="layout">
      <Header />
      <main className="layout__content">
        <div className="container">
          <Routes>
            <Route path="/" element={<HomePage />} />

            <Route path="/admin" element={<AdminPage />} />

            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route
              path="/cabinet"
              element={
                <ProtectedRoute>
                  <CabinetPage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </main>
      <Footer />
    </div>
  );
}