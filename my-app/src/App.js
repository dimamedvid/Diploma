import { Routes, Route, Navigate } from "react-router-dom";

import HomePage from "./pages/HomePage/HomePage";
import LoginPage from "./pages/LoginPage/LoginPage";
import RegisterPage from "./pages/RegisterPage/RegisterPage";
import CabinetPage from "./pages/CabinetPage/CabinetPage";
import Header from "./components/Header/Header";
import AdminPage from "./pages/AdminPage/AdminPage";
import Footer from "./components/Footer/Footer";
import ProtectedRoute from "./auth/ProtectedRoute";
import "./App.css";

export default function App() {
  return (
    <div className="layout">
    <Header />
    <div className="layout__content">
      <div className=" container">
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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
      </div>
    </div>
    <Footer />
  </div>
  );
}
