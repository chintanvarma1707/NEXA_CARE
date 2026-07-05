import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSmartHealth } from '../context/SmartHealthContext';

const NotificationBell = () => {
  const { user, socket } = useSmartHealth();
  const [alerts, setAlerts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/alerts');
      const filteredAlerts = user?.role === 'Admin' 
        ? res.data // Admin sees all alerts
        : res.data.filter(a => a.hospital_id === user?.hospital_id); // PHC sees own alerts
      
      setAlerts(filteredAlerts);
      setUnreadCount(filteredAlerts.filter(a => !a.is_resolved).length);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    }
  };

  useEffect(() => {
    if (user) fetchAlerts();
  }, [user]);

  useEffect(() => {
    if (!socket) return;
    
    const handleNewAlert = (alert) => {
      // Show notification if it's for this user
      if (user?.role === 'Admin' || alert.hospital_id === user?.hospital_id) {
        setAlerts(prev => [alert, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    };

    socket.on('new_alert', handleNewAlert);
    return () => socket.off('new_alert', handleNewAlert);
  }, [socket, user]);

  const markAsResolved = async (alertId) => {
    try {
      await axios.patch(`http://localhost:5000/api/alerts/${alertId}/resolve`);
      setAlerts(alerts.map(a => a._id === alertId ? { ...a, is_resolved: true } : a));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error resolving alert:', err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-300 hover:text-white transition-colors rounded-full hover:bg-slate-700 focus:outline-none"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
          <div className="px-4 py-3 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-emerald-400 font-medium">{unreadCount} Unread</span>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="px-4 py-6 text-center text-slate-400 text-sm">
                No notifications right now.
              </div>
            ) : (
              alerts.map(alert => (
                <div 
                  key={alert._id} 
                  className={`px-4 py-3 border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors ${!alert.is_resolved ? 'bg-slate-700/10' : 'opacity-70'}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm text-slate-200">{alert.message}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(alert.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!alert.is_resolved && (
                      <button 
                        onClick={() => markAsResolved(alert._id)}
                        className="ml-2 text-xs text-emerald-400 hover:text-emerald-300 whitespace-nowrap"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
