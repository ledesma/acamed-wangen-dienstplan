import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RosterProvider } from './context/RosterContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Join from './pages/Join';
import Roster from './pages/Roster';
import PersonalRoster from './pages/PersonalRoster';
import AdminEmployees from './pages/AdminEmployees';
import AdminShifts from './pages/AdminShifts';
import AdminTasks from './pages/AdminTasks';

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly }) => {
  const { user, isLoading } = useAuth();

  console.log('ProtectedRoute - isLoading:', isLoading, 'user:', user);

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

  if (adminOnly && user?.role !== 'admin') {
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

  if (!user || user.role !== 'admin') {
    return <Navigate to="/roster" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/join" element={<Join />} />
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
        path="/admin/employees"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <AdminEmployees />
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
    <AuthProvider>
      <RosterProvider>
        <div className="app">
          <AppRoutes />
        </div>
      </RosterProvider>
    </AuthProvider>
  );
};

export default App;