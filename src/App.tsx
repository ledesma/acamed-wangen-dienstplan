import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RosterProvider } from './context/RosterContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Join from './pages/Join';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Roster from './pages/Roster';
import PersonalRoster from './pages/PersonalRoster';
import AdminUsers from './pages/AdminUsers';
import AdminShifts from './pages/AdminShifts';
import AdminTasks from './pages/AdminTasks';

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !user?.roles?.includes('admin')) {
    return <Navigate to="/roster" replace />;
  }

  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user || !user.roles?.includes('admin')) {
    return <Navigate to="/roster" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/join" element={<Join />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/roster"
        element={
          <ProtectedRoute>
            <Layout>
              <Roster />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-roster"
        element={
          <ProtectedRoute>
            <Layout>
              <PersonalRoster />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <AdminUsers />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/shifts"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <AdminShifts />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tasks"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <AdminTasks />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/roster" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <RosterProvider>
          <div className="app">
            <AppRoutes />
          </div>
        </RosterProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;