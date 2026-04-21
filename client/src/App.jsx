import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import MataKuliahForm from "./pages/MataKuliahForm.jsx";
import InputNilaiPage from "./pages/InputNilaiPage.jsx";
import HasilEvaluasiPage from "./pages/HasilEvaluasiPage.jsx";

function RequireAuth({ children }) {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/matakuliah/new"
        element={
          <RequireAuth>
            <MataKuliahForm />
          </RequireAuth>
        }
      />
      <Route
        path="/matakuliah/:id/edit"
        element={
          <RequireAuth>
            <MataKuliahForm />
          </RequireAuth>
        }
      />
      <Route
        path="/matakuliah/:id/nilai"
        element={
          <RequireAuth>
            <InputNilaiPage />
          </RequireAuth>
        }
      />
      <Route
        path="/matakuliah/:id/hasil"
        element={
          <RequireAuth>
            <HasilEvaluasiPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
