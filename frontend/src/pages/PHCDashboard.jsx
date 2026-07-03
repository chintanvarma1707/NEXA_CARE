import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BedDouble, Users, Package, Bell, Activity, RefreshCw,
  Plus, X, UserPlus, CalendarCheck, Stethoscope, AlertTriangle, Brain
} from 'lucide-react';
import { useSmartHealth } from '../context/SmartHealthContext';
import Sidebar from '../components/Sidebar';
import BedGrid from '../components/BedGrid';
import InventoryTable from '../components/InventoryTable';
import AlertCards from '../components/AlertCards';
import StockForecastPanel from '../components/StockForecastPanel';
import LabTestsTable from '../components/LabTestsTable';
import FootfallChart from '../components/FootfallChart';

// ── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, subtext, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="glass-card p-5"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="text-right">
          <div className="stat-number">{value}</div>
        </div>
      </div>
      <div className="stat-label">{label}</div>
      {subtext && <div className="text-xs text-white/30 mt-1">{subtext}</div>}
    </motion.div>
  );
}

// ── Admit Patient Form ────────────────────────────────────────────────────
function AdmitPatientModal({ beds, hospitalId, doctors, onClose, onAdmit }) {
  const { t } = useSmartHealth();
  const [form, setForm] = useState({
    name: '', age: '', gender: 'Male', diagnosis: '', blood_group: 'Unknown',
    attending_doctor: '', address: '', assigned_bed_id: '', phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const availableBeds = beds.filter(b => b.status === 'Available');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.age || !form.diagnosis) {
      setError('Name, age, and diagnosis are required');
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form, hospital_id: hospitalId, age: parseInt(form.age) };
      if (!payload.assigned_bed_id) {
        delete payload.assigned_bed_id;
      }
      await onAdmit(payload);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to admit patient');
    } finally {
      setLoading(false);
    }
  };

  const fields = (key, label, type = 'text', opts = {}) => (
    <div>
      <label className="block text-sm text-white/60 mb-1.5">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        className="input-glass"
        {...opts}
      />
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="glass-card w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 glass-card rounded-b-none p-5 border-b border-white/10 flex items-center justify-between">
          <h3 className="section-title">
            <UserPlus className="w-5 h-5 text-primary-400" />
            {t('admitPatient')}
          </h3>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>}

          <div className="grid grid-cols-2 gap-3">
            {fields('name', `${t('patientName')} *`, 'text', { placeholder: 'Full Name', required: true })}
            {fields('age', `${t('age')} *`, 'number', { placeholder: '25', min: 0, max: 150, required: true })}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">{t('gender')}</label>
              <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))} className="input-glass">
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">{t('bloodGroup')}</label>
              <select value={form.blood_group} onChange={e => setForm(p => ({ ...p, blood_group: e.target.value }))} className="input-glass">
                {['Unknown','A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1.5">{t('diagnosis')} *</label>
            <input type="text" value={form.diagnosis} onChange={e => setForm(p => ({ ...p, diagnosis: e.target.value }))}
              className="input-glass" placeholder="e.g. Malaria, Typhoid" required />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1.5">{t('attendingDoctor')}</label>
            <select value={form.attending_doctor} onChange={e => setForm(p => ({ ...p, attending_doctor: e.target.value }))} className="input-glass">
              <option value="">— Select Doctor —</option>
              {(doctors || []).map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1.5">Assign Bed (Optional)</label>
            <select value={form.assigned_bed_id} onChange={e => setForm(p => ({ ...p, assigned_bed_id: e.target.value }))} className="input-glass">
              <option value="">— No bed assigned —</option>
              {availableBeds.map(b => <option key={b._id} value={b._id}>{b.bed_number} ({b.ward})</option>)}
            </select>
          </div>

          {fields('address', t('address'), 'text', { placeholder: 'Village, District' })}
          {fields('phone', 'Phone', 'tel', { placeholder: '9876543210' })}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-glass flex-1">{t('cancel')}</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {t('admitPatient')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Attendance Log Form ───────────────────────────────────────────────────
function AttendanceForm({ hospitalId, hospital, onLog, onClose }) {
  const { t } = useSmartHealth();
  const [present, setPresent] = useState('');
  const [total, setTotal] = useState(hospital?.doctor_count || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onLog(hospitalId, { doctors_present: parseInt(present), doctors_total: parseInt(total) });
    setLoading(false);
    onClose();
  };

  const rate = total > 0 && present !== '' ? Math.round((parseInt(present) / parseInt(total)) * 100) : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card w-full max-w-sm mx-4 p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="section-title">
            <CalendarCheck className="w-5 h-5 text-primary-400" />
            {t('logAttendance')}
          </h3>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1.5">{t('doctorsPresent')} *</label>
            <input type="number" min="0" value={present} onChange={e => setPresent(e.target.value)} className="input-glass" required placeholder="0" />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">{t('doctorsTotal')} *</label>
            <input type="number" min="1" value={total} onChange={e => setTotal(e.target.value)} className="input-glass" required placeholder="4" />
          </div>
          {rate !== null && (
            <div className={`text-center py-3 rounded-xl border ${rate < 50 ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-primary-500/10 border-primary-500/30 text-primary-400'}`}>
              <div className="text-2xl font-bold">{rate}%</div>
              <div className="text-xs opacity-70">{t('attendanceRate')}</div>
              {rate < 50 && <div className="text-xs mt-1">⚠️ Below 50% threshold</div>}
            </div>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-glass flex-1">{t('cancel')}</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CalendarCheck className="w-4 h-4" />}
              {t('save')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Main PHC Dashboard ────────────────────────────────────────────────────
export default function PHCDashboard() {
  const { t, hospitalId, getPHCDashboard, admitPatient, dischargePatient, updateInventory, restockInventory, requestRestock, getDoctors, resolveAlert, logAttendance, socket } = useSmartHealth();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdmit, setShowAdmit] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [doctors, setDoctors] = useState([]);

  const loadData = useCallback(async () => {
    if (!hospitalId) return;
    try {
      const d = await getPHCDashboard(hospitalId);
      setData(d);
      
      const docs = await getDoctors(hospitalId);
      setDoctors(docs);
    } catch (err) {
      console.error('Failed to load PHC data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hospitalId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Real-time updates via socket
  useEffect(() => {
    if (!socket) return;
    const handlers = ['bed_updated', 'patient_admitted', 'patient_discharged', 'inventory_updated', 'new_alert'];
    handlers.forEach(event => socket.on(event, () => loadData()));
    return () => handlers.forEach(event => socket.off(event));
  }, [socket, loadData]);

  const handleRefresh = () => { setRefreshing(true); loadData(); };

  const handleAdmitPatient = async (formData) => {
    await admitPatient(formData);
    loadData();
  };

  const handleRestock = async (id, stockData) => {
    await restockInventory(id, stockData);
    loadData();
  };

  const handleResolveAlert = async (id) => {
    await resolveAlert(id);
    loadData();
  };

  const handleLogAttendance = async (hId, attendData) => {
    await logAttendance(hId, attendData);
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50">{t('loading')}</p>
        </div>
      </div>
    );
  }

  const unreadAlerts = data?.alerts?.filter(a => !a.is_resolved)?.length || 0;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <FootfallChart />
              <StockForecastPanel hospitalId={hospitalId} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <StatCard label={t('availableBeds')} value={data?.bed_summary?.available ?? 0} icon={BedDouble} color="bg-primary-500/20 text-primary-400" subtext={`of ${data?.bed_summary?.total ?? 0} total`} delay={0} />
              <StatCard label={t('totalPatients')} value={data?.patients?.length ?? 0} icon={Users} color="bg-blue-500/20 text-blue-400" subtext="Currently admitted" delay={0.05} />
              <StatCard label={t('criticalStock')} value={data?.inventory_summary?.critical ?? 0} icon={Package} color="bg-red-500/20 text-red-400" subtext="Out of stock" delay={0.1} />
              <StatCard label={t('activeAlerts')} value={unreadAlerts} icon={Bell} color="bg-orange-500/20 text-orange-400" subtext="Need attention" delay={0.15} />
            </div>

            {/* Quick actions */}
            <div className="flex gap-3 flex-wrap">
              <button onClick={() => setShowAdmit(true)} className="btn-primary flex items-center gap-2">
                <UserPlus className="w-4 h-4" /> {t('admitPatient')}
              </button>
              <button onClick={() => setShowAttendance(true)} className="btn-glass flex items-center gap-2">
                <CalendarCheck className="w-4 h-4" /> {t('logAttendance')}
              </button>
              <button onClick={handleRefresh} disabled={refreshing} className="btn-glass flex items-center gap-2">
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> {t('refresh')}
              </button>
            </div>

            {/* Bed summary + alerts side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card p-5">
                <h3 className="section-title mb-4">
                  <BedDouble className="w-5 h-5 text-primary-400" />
                  {t('bedManagement')}
                </h3>
                <BedGrid beds={data?.beds || []} onDischarge={async (patientId) => { await dischargePatient(patientId); loadData(); }} />
              </div>
              <div className="glass-card p-5">
                <h3 className="section-title mb-4">
                  <Bell className="w-5 h-5 text-orange-400" />
                  {t('activeAlerts')}
                </h3>
                <AlertCards alerts={data?.alerts || []} onResolve={handleResolveAlert} />
              </div>
            </div>

            {/* AI Forecast */}
            {data?.forecasts?.predictions?.length > 0 && (
              <div className="glass-card p-5">
                <h3 className="section-title mb-4">
                  <Brain className="w-5 h-5 text-accent-500" />
                  {t('aiTitle')}
                </h3>
                <StockForecastPanel predictions={data.forecasts.predictions} />
              </div>
            )}
          </div>
        );

      case 'beds':
        return (
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="section-title">
                <BedDouble className="w-5 h-5 text-primary-400" />
                {t('bedManagement')}
              </h2>
              <button onClick={() => setShowAdmit(true)} className="btn-primary flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" /> {t('admitPatient')}
              </button>
            </div>
            <BedGrid beds={data?.beds || []} onAssignClick={() => setShowAdmit(true)} onDischarge={async (patientId) => { await dischargePatient(patientId); loadData(); }} />
          </div>
        );

      case 'patients':
        return (
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="section-title">
                <Users className="w-5 h-5 text-blue-400" />
                {t('patients')}
              </h2>
              <button onClick={() => setShowAdmit(true)} className="btn-primary flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" /> {t('admitPatient')}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('patientId')}</th>
                    <th>{t('patientName')}</th>
                    <th>{t('age')}/{t('gender')}</th>
                    <th>{t('diagnosis')}</th>
                    <th>Bed</th>
                    <th>{t('admittedDate')}</th>
                    <th>{t('status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.patients || []).map(p => (
                    <tr key={p._id}>
                      <td className="font-mono text-xs text-white/50">{p.patient_id}</td>
                      <td className="font-semibold text-white">{p.name}</td>
                      <td className="text-white/60">{p.age}y / {p.gender}</td>
                      <td><span className="badge-neutral">{p.diagnosis}</span></td>
                      <td className="text-white/60">{p.assigned_bed_id?.bed_number || '—'}</td>
                      <td className="text-white/50 text-xs">{new Date(p.admitted_date).toLocaleDateString('en-IN')}</td>
                      <td>
                        <span className={p.status === 'Critical' ? 'badge-danger' : 'badge-success'}>{p.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!data?.patients || data.patients.length === 0) && (
                <div className="text-center py-12 text-white/30">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>No admitted patients</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'inventory':
        return (
          <div className="glass-card p-6">
            <h2 className="section-title mb-6">
              <Package className="w-5 h-5 text-purple-400" />
              {t('inventory')}
            </h2>
            <InventoryTable
              items={data?.inventory || []}
              onUpdate={updateInventory}
              onRestock={async (id, d) => { await handleRestock(id, d); }}
              onRequest={async (id, d) => {
                await requestRestock(id, d);
                loadData();
              }}
            />
          </div>
        );

      case 'lab_tests':
        return (
          <div className="glass-card p-6">
            <LabTestsTable />
          </div>
        );

      case 'alerts':
        return (
          <div className="glass-card p-6">
            <h2 className="section-title mb-6">
              <Bell className="w-5 h-5 text-orange-400" />
              {t('alerts')}
            </h2>
            <AlertCards alerts={data?.alerts || []} onResolve={handleResolveAlert} />
          </div>
        );

      case 'attendance':
        return (
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="section-title">
                <Activity className="w-5 h-5 text-primary-400" />
                {t('attendance')}
              </h2>
              <button onClick={() => setShowAttendance(true)} className="btn-primary flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" /> {t('logAttendance')}
              </button>
            </div>
            {data?.hospital?.attendance_log?.length > 0 ? (
              <div className="space-y-3">
                {[...data.hospital.attendance_log].reverse().slice(0, 10).map((entry, i) => {
                  const rate = entry.doctors_total > 0 ? Math.round((entry.doctors_present / entry.doctors_total) * 100) : 0;
                  return (
                    <div key={i} className={`glass-card-sm p-4 border ${rate < 50 ? 'border-red-500/30' : 'border-white/10'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">{new Date(entry.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}</span>
                        <span className={`text-lg font-bold ${rate < 50 ? 'text-red-400' : 'text-primary-400'}`}>{rate}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${rate}%`, background: rate < 50 ? '#ef4444' : '#14b88a' }} />
                      </div>
                      <div className="flex justify-between text-xs text-white/40 mt-1">
                        <span>{entry.doctors_present} present</span>
                        <span>{entry.doctors_total} total</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-white/30">
                <Activity className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>No attendance records yet</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={false} unreadAlerts={unreadAlerts} />

      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 pl-12 lg:pl-0"
        >
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold font-display text-white">{data?.hospital?.name || 'PHC Dashboard'}</h1>
              <p className="text-sm text-white/40">{data?.hospital?.type} • {data?.hospital?.district} • {data?.hospital?.location?.village}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="pulse-dot" />
              <span className="text-xs text-white/40">Live</span>
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showAdmit && <AdmitPatientModal beds={data?.beds || []} doctors={doctors} hospitalId={hospitalId} onClose={() => setShowAdmit(false)} onAdmit={handleAdmitPatient} />}
        {showAttendance && <AttendanceForm hospitalId={hospitalId} hospital={data?.hospital} onLog={handleLogAttendance} onClose={() => setShowAttendance(false)} />}
      </AnimatePresence>
    </div>
  );
}
