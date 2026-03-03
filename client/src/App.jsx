import { Route, Routes } from "react-router-dom";
import AppHeader from "./components/AppHeader.jsx";
import Navigation from "./components/Navigation.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import DevPage from "./pages/DevPage.jsx";
import FilesPage from "./pages/FilesPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";

export default function App() {
  return (
    <AuthProvider>
      <AppHeader />
      <Navigation />
      <main className="mx-auto mt-4 max-w-6xl px-4">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/files"
            element={
              <ProtectedRoute>
                <FilesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dev"
            element={
              <ProtectedRoute>
                <DevPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </AuthProvider>
  );
}
