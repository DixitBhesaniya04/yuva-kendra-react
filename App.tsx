import React from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./services/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import AdminManagement from "./pages/AdminManagement";

const ProtectedRoute = ({
  children,
  adminOnly = false,
}: React.PropsWithChildren<{ adminOnly?: boolean }>) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading)
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  if (!isAuthenticated) return <Navigate to="/login" />;

  if (adminOnly && user?.role !== "admin") {
    return <Navigate to="/" />;
  }

  return <Layout>{children}</Layout>;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute adminOnly>
                <Routes>
                  <Route path="cities" element={<AdminManagement />} />
                  <Route path="kendras" element={<AdminManagement />} />
                  <Route path="users" element={<AdminManagement />} />
                </Routes>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
