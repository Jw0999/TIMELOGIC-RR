import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Organizations from './pages/Organizations';
import Offices from './pages/Offices';
import Departments from './pages/Departments';
import Users from './pages/Users';
import SecuritySettings from './pages/SecuritySettings';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import FraudAlerts from './pages/FraudAlerts';
import Devices from './pages/Devices';

function Guard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  // loading is already resolved by AppRoutes before Guard is ever rendered
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  // Wait for the stored-token check to finish before making any route decision.
  // Without this, the app renders with user=null, redirects to /login, then
  // immediately redirects back to /dashboard once the token resolves — login is never seen.
  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#F2F4F3]">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent" />
    </div>
  );

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      <Route path="/dashboard"     element={<Guard><Layout><Dashboard /></Layout></Guard>} />
      <Route path="/organizations" element={<Guard><Layout><Organizations /></Layout></Guard>} />
      <Route path="/devices"       element={<Guard><Layout><Devices /></Layout></Guard>} />
      <Route path="/offices"       element={<Guard><Layout><Offices /></Layout></Guard>} />
      <Route path="/departments"   element={<Guard><Layout><Departments /></Layout></Guard>} />
      <Route path="/users"         element={<Guard><Layout><Users /></Layout></Guard>} />
      <Route path="/fraud-alerts"  element={<Guard><Layout><FraudAlerts /></Layout></Guard>} />
      <Route path="/security"      element={<Guard><Layout><SecuritySettings /></Layout></Guard>} />
      <Route path="/reports"       element={<Guard><Layout><Reports /></Layout></Guard>} />
      <Route path="/settings"      element={<Guard><Layout><Settings /></Layout></Guard>} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}
