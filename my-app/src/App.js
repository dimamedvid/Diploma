import { Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage/HomePage";
import LoginPage from "./pages/LoginPage/LoginPage";
import RegisterPage from "./pages/RegisterPage/RegisterPage";
import CabinetPage from "./pages/CabinetPage/CabinetPage";
import WorkDetailsPage from "./pages/WorkDetailsPage/WorkDetailsPage";
import CreateWorkPage from "./pages/CreateWorkPage/CreateWorkPage";
import EditWorkPage from "./pages/EditWorkPage/EditWorkPage";
import Header from "./components/Header/Header";
import AdminPage from "./pages/AdminPage/AdminPage";
import AdminStatsPage from "./pages/AdminStatsPage/AdminStatsPage";
import Footer from "./components/Footer/Footer";
import ProtectedRoute from "./auth/ProtectedRoute";
import AdminRoute from "./auth/AdminRoute";
import NotFoundPage from "./pages/NotFoundPage/NotFoundPage";
import UserProfilePage from "./pages/UserProfilePage/UserProfilePage";
import "./App.css";

/**
 * Головний компонент застосунку.
 *
 * Визначає основні маршрути, layout застосунку,
 * захищені сторінки користувача та захищені сторінки модерації.
 *
 * @returns {JSX.Element} Основна структура застосунку.
 */
export default function App() {
  return (
    <div className="layout">
      <Header />

      <main className="layout__content">
        <div className="container">
          <Routes>
            <Route path="/" element={<HomePage />} />

            <Route
              path="/works/create"
              element={
                <ProtectedRoute>
                  <CreateWorkPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/works/edit/:id"
              element={
                <ProtectedRoute>
                  <EditWorkPage />
                </ProtectedRoute>
              }
            />

            <Route path="/works/:id" element={<WorkDetailsPage />} />

            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/stats"
              element={
                <AdminRoute>
                  <AdminStatsPage />
                </AdminRoute>
              }
            />

            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/users/:id" element={<UserProfilePage />} />

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