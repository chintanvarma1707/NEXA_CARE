import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import translations from '../i18n/translations';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SmartHealthContext = createContext(null);

export function SmartHealthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('nc_token') || null);
  const [language, setLanguage] = useState(localStorage.getItem('nc_lang') || 'en');
  const [theme, setTheme] = useState(localStorage.getItem('nc_theme') || 'dark');
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [globalToast, setGlobalToast] = useState(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.body.className = theme === 'dark' ? 'dark-theme' : 'light-theme';
  }, [theme]);

  // Translation helper
  const t = useCallback((key) => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  }, [language]);

  // Axios instance with auth header
  const api = axios.create({
    baseURL: API_URL,
    headers: { Authorization: token ? `Bearer ${token}` : '' }
  });

  // ── Auth ─────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      const { token: newToken, user: newUser } = res.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('nc_token', newToken);
      return { success: true, user: newUser };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('nc_token');
    if (socket) socket.disconnect();
  };

  const fetchMe = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.get('/api/auth/me');
      setUser(res.data);
    } catch {
      logout();
    }
  }, [token]);

  useEffect(() => { fetchMe(); }, []);

  // ── Socket.IO ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token || !user) return;
    const s = io(API_URL, { auth: { token } });

    if (user.role === 'District_Admin') {
      s.emit('join_admin');
    } else if (user.hospital_id) {
      const hospitalId = user.hospital_id?._id || user.hospital_id;
      s.emit('join_hospital', hospitalId);
    }

    s.on('new_alert', (alert) => {
      setNotifications(prev => [{ ...alert, _id: alert._id || Date.now() }, ...prev].slice(0, 20));
      setGlobalToast({
        type: alert.severity === 'Low' || alert.type.includes('Approved') ? 'success' : 'error',
        title: alert.type.replace('-', ' '),
        message: alert.message
      });
      setTimeout(() => setGlobalToast(null), 6000);
    });

    setSocket(s);
    return () => s.disconnect();
  }, [token, user]);

  // ── Language & Theme ──────────────────────────────────────────────────────
  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('nc_lang', lang);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('nc_theme', newTheme);
  };

  // ── API Helpers ───────────────────────────────────────────────────────────
  const getHospitals = () => api.get('/api/hospitals').then(r => r.data);
  const getHospital = (id) => api.get(`/api/hospitals/${id}`).then(r => r.data);

  const getBeds = (hospitalId) => api.get(`/api/beds/${hospitalId}`).then(r => r.data);
  const assignBed = (bedId, patientId) => api.patch(`/api/beds/${bedId}/assign`, { patient_id: patientId }).then(r => r.data);
  const releaseBed = (bedId) => api.patch(`/api/beds/${bedId}/release`).then(r => r.data);

  const getPatients = (hospitalId, status) => api.get(`/api/patients/${hospitalId}${status ? `?status=${status}` : ''}`).then(r => r.data);
  const admitPatient = (data) => api.post('/api/patients', data).then(r => r.data);
  const updatePatient = (id, data) => api.put(`/api/patients/${id}`, data).then(r => r.data);
  const dischargePatient = (id) => api.delete(`/api/patients/${id}`).then(r => r.data);

  const getInventory = (hospitalId) => api.get(`/api/inventory/${hospitalId}`).then(r => r.data);
  const addInventory = (data) => api.post('/api/inventory', data).then(r => r.data);
  const updateInventory = (id, data) => api.put(`/api/inventory/${id}`, data).then(r => r.data);
  const restockInventory = (id, data) => api.post(`/api/inventory/${id}/restock`, data).then(r => r.data);
  const requestRestock = (id, data) => api.post(`/api/inventory/${id}/request`, data).then(r => r.data);
  const logStockUsage = (id, data) => api.post(`/api/inventory/${id}/log-usage`, data).then(r => r.data);
  const deleteInventory = (id) => api.delete(`/api/inventory/${id}`).then(r => r.data);
  const runAIStockCheck = (hospitalId) => api.post(`/api/inventory/ai-stock-check/${hospitalId}`).then(r => r.data);

  const getAlerts = (params) => api.get('/api/alerts', { params }).then(r => r.data);
  const resolveAlert = (id) => api.patch(`/api/alerts/${id}/resolve`).then(r => r.data);
  const resolveAllAlerts = (severity) => api.patch(`/api/alerts/resolve-all${severity ? `?severity=${severity}` : ''}`).then(r => r.data);

  const getAdminDashboard = () => api.get('/api/dashboard/admin').then(r => r.data);
  const getPHCDashboard = (hospitalId) => api.get(`/api/dashboard/phc/${hospitalId}`).then(r => r.data);

  const logAttendance = (hospitalId, data) => api.post(`/api/hospitals/${hospitalId}/attendance`, data).then(r => r.data);

  const getDoctors = (hospitalId) => api.get(`/api/doctors/${hospitalId}`).then(r => r.data);

  // Logistics & Transfers
  const getTransfers = (hospitalId) => api.get(`/api/logistics/transfers?hospital_id=${hospitalId}`).then(r => r.data);
  const createTransfer = (data) => api.post('/api/logistics/transfers', data).then(r => r.data);
  const dispatchTransfer = (id) => api.patch(`/api/logistics/transfers/${id}/dispatch`).then(r => r.data);
  const receiveTransfer = (id) => api.patch(`/api/logistics/transfers/${id}/receive`).then(r => r.data);

  // Referrals
  const getReferrals = (hospitalId) => api.get(`/api/logistics/referrals?hospital_id=${hospitalId}`).then(r => r.data);
  const createReferral = (data) => api.post('/api/logistics/referrals', data).then(r => r.data);
  const acceptReferral = (id) => api.patch(`/api/logistics/referrals/${id}/accept`).then(r => r.data);
  const value = {
    user, token, loading, language, theme, t, socket, notifications,
    login, logout, changeLanguage, toggleTheme,
    getHospitals, getHospital,
    getBeds, assignBed, releaseBed,
    getPatients, admitPatient, updatePatient, dischargePatient,
    getInventory, addInventory, updateInventory, restockInventory, requestRestock, logStockUsage, deleteInventory, runAIStockCheck,
    getAlerts, resolveAlert, resolveAllAlerts,
    getAdminDashboard, getPHCDashboard,
    logAttendance, getDoctors,
    getTransfers, createTransfer, dispatchTransfer, receiveTransfer,
    getReferrals, createReferral, acceptReferral,
    isAdmin: user?.role === 'District_Admin',
    isPHC: user?.role === 'PHC_Manager' || user?.role === 'CHC_Manager',
    isReceptionist: user?.role === 'Receptionist',
    isInventoryManager: user?.role === 'Inventory_Manager',
    hospitalId: user?.hospital_id?._id || user?.hospital_id
  };

  return (
    <SmartHealthContext.Provider value={value}>
      <AnimatePresence>
        {globalToast && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className={`fixed top-8 right-8 z-[9999] border-2 p-4 rounded-2xl shadow-2xl flex items-start gap-4 max-w-sm w-full ${
              globalToast.type === 'error' 
                ? 'bg-red-50 dark:bg-red-900/95 border-red-500 text-red-900 dark:text-red-100 shadow-[0_10px_40px_rgba(239,68,68,0.4)]' 
                : 'bg-emerald-50 dark:bg-emerald-900/95 border-emerald-500 text-emerald-900 dark:text-emerald-100 shadow-[0_10px_40px_rgba(16,185,129,0.4)]'
            }`}
          >
            <div className={`p-2 rounded-full flex-shrink-0 ${globalToast.type === 'error' ? 'bg-red-100 dark:bg-red-500/30' : 'bg-emerald-100 dark:bg-emerald-500/30'}`}>
              {globalToast.type === 'error' ? <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" /> : <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
            </div>
            <div className="flex-1 pt-0.5">
              <h4 className="font-bold text-base mb-1">{globalToast.title}</h4>
              <p className="text-sm opacity-90 leading-relaxed">{globalToast.message}</p>
            </div>
            <button onClick={() => setGlobalToast(null)} className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </SmartHealthContext.Provider>
  );
}

export const useSmartHealth = () => {
  const ctx = useContext(SmartHealthContext);
  if (!ctx) throw new Error('useSmartHealth must be used inside SmartHealthProvider');
  return ctx;
};
