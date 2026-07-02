import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SmartHealthProvider, useSmartHealth } from './context/SmartHealthContext';
import LoginPage from './pages/LoginPage';
import PHCDashboard from './pages/PHCDashboard';
import AdminDashboard from './pages/AdminDashboard';

function AppRoutes() {
  const { user } = useSmartHealth();

  if (!user) return <LoginPage />;

  return (
    <Routes>
      <Route
        path="/"
        element={
          user.role === 'District_Admin'
            ? <Navigate to="/admin" replace />
            : <Navigate to="/phc" replace />
        }
      />
      <Route path="/phc/*" element={
        ['PHC_Manager', 'Receptionist', 'Inventory_Manager'].includes(user.role)
          ? <PHCDashboard />
          : <Navigate to="/admin" replace />
      } />
      <Route path="/admin/*" element={
        user.role === 'District_Admin'
          ? <AdminDashboard />
          : <Navigate to="/phc" replace />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <SmartHealthProvider>
      <div className="bg-app min-h-screen">
        <AppRoutes />
      </div>
    </SmartHealthProvider>
  );
}
