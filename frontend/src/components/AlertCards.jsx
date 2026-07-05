import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertCircle, Bell, XCircle, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import { useSmartHealth } from '../context/SmartHealthContext';

const ALERT_CONFIG = {
  'Stock-Out': { icon: XCircle, color: 'border-red-500/40 bg-red-500/8', iconColor: 'text-red-400', badge: 'badge-danger' },
  'Low-Stock': { icon: AlertTriangle, color: 'border-orange-500/40 bg-orange-500/8', iconColor: 'text-orange-400', badge: 'badge-warning' },
  'Underperformance': { icon: AlertCircle, color: 'border-yellow-500/40 bg-yellow-500/8', iconColor: 'text-yellow-400', badge: 'badge-warning' },
  'Bed-Full': { icon: Bell, color: 'border-blue-500/40 bg-blue-500/8', iconColor: 'text-blue-400', badge: 'badge-info' },
  'AI-Forecast': { icon: Bell, color: 'border-purple-500/40 bg-purple-500/8', iconColor: 'text-purple-400', badge: 'badge-info' },
  'Expiry-Warning': { icon: Clock, color: 'border-yellow-500/40 bg-yellow-500/8', iconColor: 'text-yellow-400', badge: 'badge-warning' },
};

export default function AlertCards({ alerts = [], onResolve, onResolveAll, showHospital = false }) {
  const { t } = useSmartHealth();
  const [filterSeverity, setFilterSeverity] = useState('All');

  const active = alerts.filter(a => {
    if (a.is_resolved) return false;
    if (filterSeverity !== 'All' && a.severity !== filterSeverity) return false;
    return true;
  });
  const resolved = alerts.filter(a => {
    if (!a.is_resolved) return false;
    if (filterSeverity !== 'All' && a.severity !== filterSeverity) return false;
    return true;
  });

  if (alerts.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-primary-400 opacity-60" />
        <p className="text-lg font-semibold text-white/60">{t('noAlerts')}</p>
        <p className="text-sm text-white/30 mt-1">All systems operating normally</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      {alerts.some(a => !a.is_resolved) && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex flex-wrap gap-2">
            {['All', 'Critical', 'High', 'Medium', 'Low'].map(s => (
              <button key={s} onClick={() => setFilterSeverity(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterSeverity === s ? 'bg-primary-500 text-white' : 'glass-card-sm text-white/50 hover:text-white'}`}>
                {s}
              </button>
            ))}
          </div>
          {onResolveAll && active.some(a => a.type === 'Restock-Request') && (
            <button
              onClick={() => onResolveAll(filterSeverity)}
              className="btn-primary bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 border-none text-xs px-4 py-1.5 flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              <CheckCircle className="w-4 h-4" />
              Accept All Restocks
            </button>
          )}
        </div>
      )}

      {/* Active */}
      {active.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="pulse-dot" />
            {t('activeAlerts')} ({active.length})
          </h4>
          <div className="space-y-3">
            <AnimatePresence>
              {active.map((alert, i) => {
                const cfg = ALERT_CONFIG[alert.type] || ALERT_CONFIG['Stock-Out'];
                const Icon = cfg.icon;
                return (
                  <motion.div
                    key={alert._id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16, height: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`glass-card-sm border ${cfg.color} p-4`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.color}`}>
                        <Icon className={`w-5 h-5 ${cfg.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={cfg.badge}>{alert.type}</span>
                          <span className={`${cfg.badge} text-xs`}>{alert.severity}</span>
                          {showHospital && alert.hospital_id?.name && (
                            <span className="badge-neutral text-xs">{alert.hospital_id.name}</span>
                          )}
                        </div>
                        <p className="text-sm text-white/80 leading-relaxed">{alert.message}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-white/30 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(alert.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      {onResolve && (
                        <button
                          onClick={() => onResolve(alert._id)}
                          className="btn-glass text-xs px-3 py-1.5 flex items-center gap-1.5 flex-shrink-0"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          {t('resolve')}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Resolved */}
      {resolved.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">
            ✓ {t('resolvedAlerts')} ({resolved.length})
          </h4>
          <div className="space-y-2 opacity-50">
            {resolved.slice(0, 3).map(alert => (
              <div key={alert._id} className="glass-card-sm border border-white/10 p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary-400 flex-shrink-0" />
                  <p className="text-sm text-white/50 line-through truncate">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
