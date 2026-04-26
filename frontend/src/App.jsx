import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import DSAPractice from './pages/DSAPractice';
import DBMSAnalysis from './pages/DBMSAnalysis';
import Projects from './pages/Projects';
import DailyGoals from './pages/DailyGoals';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Sidebar from './components/Sidebar';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading GoalPath...</p>
      </div>
    );
  }
  return user ? children : <Navigate to="/auth" replace />;
};

const AppLayout = ({ children }) => {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/auth"
        element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />}
      />
      <Route path="/login" element={<Navigate to="/auth" replace />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout><Dashboard /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dsa"
        element={
          <ProtectedRoute>
            <AppLayout><DSAPractice /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dbms"
        element={
          <ProtectedRoute>
            <AppLayout><DBMSAnalysis /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <AppLayout><Projects /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/goals"
        element={
          <ProtectedRoute>
            <AppLayout><DailyGoals /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <AppLayout><Analytics /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppLayout><Profile /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a2035',
              color: '#e2e8f0',
              border: '1px solid rgba(99, 179, 237, 0.2)',
              borderRadius: '12px',
              fontFamily: 'Sora, sans-serif',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#48bb78', secondary: '#1a2035' },
            },
            error: {
              iconTheme: { primary: '#fc8181', secondary: '#1a2035' },
            },
          }}
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
