import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SmartHealthProvider, useSmartHealth } from './context/SmartHealthContext';
import LoginPage from './pages/LoginPage';
import HospitalDashboard from './pages/HospitalDashboard';
import AdminDashboard from './pages/AdminDashboard';
import GlobalAIAgent from './components/GlobalAIAgent';

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
            : <Navigate to="/hospital" replace />
        }
      />
      <Route path="/hospital/*" element={
        ['PHC_Manager', 'CHC_Manager', 'Receptionist', 'Inventory_Manager'].includes(user.role)
          ? <HospitalDashboard />
          : <Navigate to="/admin" replace />
      } />
      <Route path="/admin/*" element={
        user.role === 'District_Admin'
          ? <AdminDashboard />
          : <Navigate to="/hospital" replace />
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
        <GlobalAIAgent />
      </div>
    </SmartHealthProvider>
  );
}
