import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Building2, BedDouble, Users, Package, Bell,
  Globe, Zap, RefreshCw, TrendingUp, TrendingDown, AlertTriangle,
  MapPin, Phone, CheckCircle, ArrowRight, ShieldAlert, ThumbsDown, UserX, TriangleAlert
} from 'lucide-react';
import { useSmartHealth } from '../context/SmartHealthContext';
import Sidebar from '../components/Sidebar';
import AlertCards from '../components/AlertCards';
import InventoryTable from '../components/InventoryTable';
import RedistributionCard from '../components/RedistributionCard';
import NotificationBell from '../components/NotificationBell';

// ── Stat Card ─────────────────────────────────────────────────────────────
function BigStat({ label, value, sub, icon: Icon, color, gradient }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-10" style={{ background: gradient }} />
      <div className="relative z-10">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="text-4xl font-bold text-white font-display">{value ?? '—'}</div>
        <div className="text-sm text-white/60 mt-1 font-medium">{label}</div>
        {sub && <div className="text-xs text-white/30 mt-0.5">{sub}</div>}
      </div>
    </motion.div>
  );
}

// ── Hospital Card ─────────────────────────────────────────────────────────
function HospitalCard({ hospital, delay = 0 }) {
  const { t } = useSmartHealth();
  const occupancyColor = hospital.occupancy_rate > 85 ? 'text-red-400' :
    hospital.occupancy_rate > 60 ? 'text-orange-400' : 'text-primary-400';
  const occupancyBg = hospital.occupancy_rate > 85 ? '#ef4444' :
    hospital.occupancy_rate > 60 ? '#f97316' : '#14b88a';

  const attendancePct = hospital.recent_attendance_rate ?? 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="glass-card p-5 hover:border-white/20 transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary-400" />
            </div>
            <span className="font-bold text-white font-display">{hospital.name}</span>
          </div>
          <div className="flex items-center gap-2 pl-10">
            <span className="badge-neutral text-xs">{hospital.type}</span>
            <span className="flex items-center gap-1 text-xs text-white/40">
              <MapPin className="w-3 h-3" />{hospital.district}
            </span>
          </div>
        </div>
        {hospital.alert_count > 0 && (
          <span className="badge-danger flex items-center gap-1">
            <Bell className="w-3 h-3" />{hospital.alert_count}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="glass-card-sm p-2.5 text-center">
          <div className="text-lg font-bold text-primary-400">{hospital.available_beds}</div>
          <div className="text-xs text-white/40">{t('bedAvailable')}</div>
        </div>
        <div className="glass-card-sm p-2.5 text-center">
          <div className="text-lg font-bold text-red-400">{hospital.occupied_beds}</div>
          <div className="text-xs text-white/40">{t('bedOccupied')}</div>
        </div>
        <div className="glass-card-sm p-2.5 text-center">
          <div className={`text-lg font-bold ${hospital.low_stock_count > 0 ? 'text-orange-400' : 'text-white/60'}`}>
            {hospital.low_stock_count}
          </div>
          <div className="text-xs text-white/40">{t('lowStock')}</div>
        </div>
      </div>

      {/* Occupancy bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-white/40 mb-1">
          <span className="text-xs text-white/40">{t('occupancyRate')}</span>
          <span className={`font-semibold ${occupancyColor}`}>{hospital.occupancy_rate}%</span>
        </div>
        <div className="progress-bar">
          <motion.div
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${hospital.occupancy_rate}%` }}
            transition={{ duration: 0.8, delay: delay + 0.2 }}
            style={{ background: occupancyBg }}
          />
        </div>
      </div>

      {/* Attendance */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/40">Doctor Attendance (3d avg)</span>
        <span className={`font-semibold ${attendancePct < 50 ? 'text-red-400' : 'text-primary-400'}`}>
          {attendancePct < 50 && <AlertTriangle className="w-3 h-3 inline mr-1" />}
          {attendancePct}%
        </span>
      </div>
    </motion.div>
  );
}

// ── Flagged Facilities Panel ─────────────────────────────────────────────────
function FlaggedFacilitiesPanel({ hospitals = [] }) {
  const { t } = useSmartHealth();

  const flagged = hospitals.map(h => {
    const reasons = [];
    if ((h.recent_attendance_rate ?? 100) < 50) reasons.push({ icon: UserX, label: `Low Attendance (${h.recent_attendance_rate ?? 0}%)`, severity: 'critical' });
    if (h.low_stock_count > 3) reasons.push({ icon: Package, label: `${h.low_stock_count} Low Stock Items`, severity: 'high' });
    if ((h.occupancy_rate ?? 0) > 90) reasons.push({ icon: BedDouble, label: `Overcrowded (${h.occupancy_rate}% occupancy)`, severity: 'high' });
    if (h.alert_count > 2) reasons.push({ icon: Bell, label: `${h.alert_count} Unresolved Alerts`, severity: 'medium' });
    return { ...h, reasons };
  }).filter(h => h.reasons.length > 0);

  if (flagged.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto mb-4 opacity-70" />
        <p className="text-lg font-bold text-white">All Facilities Performing Well</p>
        <p className="text-sm text-white/40 mt-1">No underperforming or under-resourced centres detected.</p>
      </div>
    );
  }

  const severityColor = (s) => s === 'critical' ? 'text-red-400 bg-red-500/15 border-red-500/30' : s === 'high' ? 'text-orange-400 bg-orange-500/15 border-orange-500/30' : 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30';

  return (
    <div className="space-y-4">
      {flagged.map((h, i) => (
        <motion.div
          key={h._id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.07 }}
          className="glass-card p-5 border-l-4 border-red-500"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">{h.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="badge-neutral text-xs">{h.type}</span>
                  <span className="text-xs text-white/40 flex items-center gap-1"><MapPin className="w-3 h-3"/>{h.district}</span>
                </div>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
              <TriangleAlert className="w-3 h-3" /> Needs Intervention
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {h.reasons.map((r, ri) => (
              <div key={ri} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${severityColor(r.severity)}`}>
                <r.icon className="w-3.5 h-3.5" />
                {r.label}
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Main Admin Dashboard ──────────────────────────────────────────────────
export default function AdminDashboard() {
  const { t, getAdminDashboard, resolveAlert, resolveAllAlerts, socket } = useSmartHealth();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const d = await getAdminDashboard();
      setData(d);
    } catch (err) {
      console.error('Admin dashboard load failed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Real-time via socket
  useEffect(() => {
    if (!socket) return;
    const events = ['bed_updated', 'patient_admitted', 'inventory_updated', 'new_alert', 'alert_resolved', 'attendance_updated'];
    events.forEach(e => socket.on(e, () => loadData()));
    return () => events.forEach(e => socket.off(e));
  }, [socket, loadData]);

  const handleRefresh = () => { setRefreshing(true); loadData(); };
  const handleResolveAlert = async (id) => { await resolveAlert(id); loadData(); };
  const handleResolveAll = async (severity) => { await resolveAllAlerts(severity); loadData(); };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-accent-500/30 border-t-accent-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50">{t('loading')}</p>
        </div>
      </div>
    );
  }

  const overview = data?.overview || {};
  const unreadAlerts = overview.active_alerts || 0;

  // All inventory across all hospitals (for admin view)
  const allInventory = data?.hospitals?.flatMap(h =>
    (data?.critical_stock || []).filter(i => String(i.hospital_id?._id || i.hospital_id) === String(h._id))
  ) || data?.critical_stock || [];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Big stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <BigStat label={t('allHospitals')} value={overview.total_hospitals} icon={Building2} color="bg-accent-500/20 text-accent-500" gradient="linear-gradient(135deg, #6366f1, transparent)" />
              <BigStat label={t('totalBeds')} value={overview.total_beds} sub={`${overview.Occupied || 0} occupied`} icon={BedDouble} color="bg-primary-500/20 text-primary-400" gradient="linear-gradient(135deg, #14b88a, transparent)" />
              <BigStat label={t('totalPatients')} value={overview.total_patients} icon={Users} color="bg-blue-500/20 text-blue-400" gradient="linear-gradient(135deg, #3b82f6, transparent)" />
              <BigStat label={t('activeAlerts')} value={overview.active_alerts} icon={Bell} color="bg-red-500/20 text-red-400" gradient="linear-gradient(135deg, #ef4444, transparent)" />
            </div>

            {/* System health bar */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="section-title">{t('systemOverview')}</h3>
                <button onClick={handleRefresh} disabled={refreshing} className="btn-glass flex items-center gap-2 text-sm">
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> {t('refresh')}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: t('occupancyRate'), value: `${overview.occupancy_rate || 0}%`, color: (overview.occupancy_rate || 0) > 85 ? '#ef4444' : '#14b88a', bg: (overview.occupancy_rate || 0) > 85 ? 'text-red-400' : 'text-primary-400' },
                  { label: t('criticalStock'), value: `${overview.critical_stock_items || 0}`, color: '#ef4444', bg: 'text-red-400' },
                  { label: t('availableBeds'), value: `${overview.Available || 0}`, color: '#14b88a', bg: 'text-primary-400' },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} className="glass-card-sm p-4">
                    <div className={`text-2xl font-bold font-display ${bg}`}>{value}</div>
                    <div className="text-xs text-white/40 mt-1">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hospitals grid */}
            <div>
              <h3 className="section-title mb-4">
                <Building2 className="w-5 h-5 text-accent-500" />
                {t('allHospitals')}
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {(data?.hospitals || []).map((h, i) => (
                  <HospitalCard key={h._id} hospital={h} delay={i * 0.08} />
                ))}
              </div>
            </div>

            {/* Flagged Facilities Panel */}
            {(() => {
              const flagged = (data?.hospitals || []).filter(h =>
                (h.recent_attendance_rate ?? 100) < 50 ||
                h.low_stock_count > 3 ||
                (h.occupancy_rate ?? 0) > 90 ||
                h.alert_count > 2
              );
              if (flagged.length === 0) return null;
              return (
                <div className="glass-card p-5 border border-red-500/30 bg-red-500/5">
                  <h3 className="section-title mb-4 text-red-400">
                    <ShieldAlert className="w-5 h-5" />
                    🚨 Flagged Facilities — Needs Admin Intervention ({flagged.length})
                  </h3>
                  <FlaggedFacilitiesPanel hospitals={data?.hospitals || []} />
                </div>
              );
            })()}

            {/* Alerts + Redistribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card p-5">
                <h3 className="section-title mb-4">
                  <Bell className="w-5 h-5 text-red-400" />
                  {t('activeAlerts')}
                </h3>
                <AlertCards alerts={data?.alerts || []} onResolve={handleResolveAlert} onResolveAll={handleResolveAll} showHospital={true} />
              </div>
              <div className="glass-card p-5">
                <h3 className="section-title mb-4">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  {t('transferRecommendations')}
                </h3>
                <RedistributionCard recommendations={data?.redistribution || []} />
              </div>
            </div>
          </div>
        );

      case 'hospitals':
        return (
          <div className="space-y-4">
            <h2 className="section-title">
              <Building2 className="w-5 h-5 text-accent-500" />
              {t('allHospitals')}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {(data?.hospitals || []).map((h, i) => (
                <HospitalCard key={h._id} hospital={h} delay={i * 0.06} />
              ))}
            </div>
          </div>
        );

      case 'alerts':
        return (
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="section-title">
                <Bell className="w-5 h-5 text-red-400" />
                {t('alerts')} — All Hospitals
              </h2>
              <button onClick={handleRefresh} disabled={refreshing} className="btn-glass flex items-center gap-2 text-sm">
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> {t('refresh')}
              </button>
            </div>
            <AlertCards alerts={data?.alerts || []} onResolve={handleResolveAlert} showHospital={true} />
          </div>
        );

      case 'inventory':
        return (
          <div className="glass-card p-6">
            <h2 className="section-title mb-6">
              <Package className="w-5 h-5 text-purple-400" />
              {t('inventory')} — {t('allHospitals')}
            </h2>
            <InventoryTable items={data?.critical_stock || []} readOnly={true} />
          </div>
        );

      case 'redistribution':
        return (
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="section-title">
                <Zap className="w-5 h-5 text-yellow-400" />
                {t('transferRecommendations')}
              </h2>
              <button onClick={handleRefresh} disabled={refreshing} className="btn-glass flex items-center gap-2 text-sm">
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> {t('refresh')}
              </button>
            </div>
            <p className="text-sm text-white/40 mb-6">{t('aiSubtitle')}</p>
            <RedistributionCard recommendations={data?.redistribution || []} />
          </div>
        );

      case 'flagged':
        return (
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="section-title text-red-400">
                <ShieldAlert className="w-5 h-5" />
                Flagged Facilities — Intervention Required
              </h2>
              <button onClick={handleRefresh} disabled={refreshing} className="btn-glass flex items-center gap-2 text-sm">
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> {t('refresh')}
              </button>
            </div>
            <p className="text-sm text-white/40 mb-6">Centres automatically flagged due to low attendance, critical stock, overcrowding, or unresolved alerts.</p>
            <FlaggedFacilitiesPanel hospitals={data?.hospitals || []} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={true} unreadAlerts={unreadAlerts} />

      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 pl-12 lg:pl-0 flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold font-display text-white flex items-center gap-2">
              <Globe className="w-6 h-6 text-accent-500" />
              {t('districtOverview')}
            </h1>
            <p className="text-sm text-white/40 mt-1">
              Monitoring {overview.total_hospitals || 0} facilities • Pune & Nashik Districts
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="pulse-dot" />
              <span className="text-xs text-white/40">Real-time sync</span>
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
