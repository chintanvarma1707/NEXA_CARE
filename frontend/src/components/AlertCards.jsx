import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertCircle, Bell, XCircle, CheckCircle, Clock, ChevronRight, Building2 } from 'lucide-react';
import { useSmartHealth } from '../context/SmartHealthContext';

import { Search } from 'lucide-react';

const SEVERITY_STYLES = {
  'Critical': { accent: 'bg-red-500', iconBg: 'bg-red-500/10 border border-red-500/20', text: 'text-red-400', badge: 'bg-red-500/20 text-red-400 border border-red-500/30' },
  'High': { accent: 'bg-orange-500', iconBg: 'bg-orange-500/10 border border-orange-500/20', text: 'text-orange-400', badge: 'bg-orange-500/20 text-orange-400 border border-orange-500/30' },
  'Medium': { accent: 'bg-yellow-400', iconBg: 'bg-yellow-400/10 border border-yellow-400/20', text: 'text-yellow-400', badge: 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30' },
  'Low': { accent: 'bg-emerald-500', iconBg: 'bg-emerald-500/10 border border-emerald-500/20', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
};

const TYPE_ICONS = {
  'Stock-Out': XCircle,
  'Low-Stock': AlertTriangle,
  'Restock-Request': AlertTriangle,
  'Restock-Approved': CheckCircle,
  'Underperformance': AlertCircle,
  'Bed-Full': Bell,
  'AI-Forecast': Bell,
  'Expiry-Warning': Clock,
};

export default function AlertCards({ alerts = [], onResolve, onResolveAll, showHospital = false }) {
  const { t } = useSmartHealth();
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const active = alerts.filter(a => {
    if (a.is_resolved) return false;
    if (filterSeverity !== 'All' && a.severity !== filterSeverity) return false;
    if (searchQuery && !a.message.toLowerCase().includes(searchQuery.toLowerCase()) && !a.hospital_id?.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });
  const resolved = alerts.filter(a => {
    if (!a.is_resolved) return false;
    if (filterSeverity !== 'All' && a.severity !== filterSeverity) return false;
    if (searchQuery && !a.message.toLowerCase().includes(searchQuery.toLowerCase()) && !a.hospital_id?.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
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
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-2 sm:gap-3">
            <div className="flex flex-wrap gap-2">
              {['All', 'Critical', 'High', 'Medium', 'Low'].map(s => {
                const isActive = filterSeverity === s;
                const sev = SEVERITY_STYLES[s];
                const activeClass = s === 'All' ? 'bg-white/10 text-white border-white/20' 
                                  : isActive ? `${sev.iconBg} ${sev.text}` 
                                  : 'glass-card-sm text-white/50 hover:text-white border-transparent hover:border-white/10';
                return (
                  <button key={s} onClick={() => setFilterSeverity(s)}
                    className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs font-semibold transition-all border ${activeClass}`}>
                    {s}
                  </button>
                );
              })}
            </div>
            {onResolveAll && active.some(a => a.type === 'Restock-Request') && (
              <button
                onClick={() => onResolveAll(filterSeverity)}
                className="btn-primary bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 border-none text-xs px-3 py-1.5 sm:px-4 flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                <CheckCircle className="w-4 h-4" />
                Accept All Restocks
              </button>
            )}
          </div>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input 
              type="text"
              placeholder="Search alerts or hospitals..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-glass pl-10 py-2 text-sm w-full"
            />
          </div>
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
                const sevCfg = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES['Medium'];
                const Icon = TYPE_ICONS[alert.type] || AlertCircle;
                return (
                  <motion.div
                    key={alert._id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16, height: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`relative glass-card-sm p-5 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 group overflow-hidden border-white/10 bg-white/[0.03]`}
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${sevCfg.accent}`} />
                    
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${sevCfg.iconBg}`}>
                        <Icon className={`w-5 h-5 ${sevCfg.text}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                           <div className="flex items-center gap-3">
                              <h3 className="text-white font-bold text-sm tracking-wide">{alert.type.replace('-', ' ')}</h3>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${sevCfg.badge}`}>{alert.severity}</span>
                           </div>
                           <span className="text-[11px] font-medium text-white/40 flex items-center gap-1.5">
                             <Clock className="w-3.5 h-3.5" />
                             {new Date(alert.createdAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                           </span>
                        </div>
                        
                        <p className="text-white/70 text-sm leading-relaxed mb-4 pr-8">{alert.message}</p>
                        
                        <div className="flex items-center justify-between">
                           {showHospital && alert.hospital_id?.name ? (
                             <div className="flex items-center gap-1.5 text-xs font-semibold text-white/50 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
                               <Building2 className="w-3.5 h-3.5" />
                               {alert.hospital_id.name}
                             </div>
                           ) : ( <div /> )}
                           
                           {onResolve && (
                             <button
                               onClick={() => onResolve(alert._id)}
                               className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/15 hover:text-white transition-all border border-white/10"
                             >
                               <CheckCircle className="w-4 h-4" />
                               Mark as Resolved
                             </button>
                           )}
                        </div>
                      </div>
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
