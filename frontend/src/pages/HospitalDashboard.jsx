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
import NotificationBell from '../components/NotificationBell';
import AttendanceSystem from '../components/AttendanceSystem';

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

function AdmitPatientModal({ beds, hospitalId, doctors, onClose, onAdmit, initialData }) {
  const { t } = useSmartHealth();
  const [form, setForm] = useState(initialData ? {
    name: initialData.name || '', age: initialData.age || '', gender: initialData.gender || 'Male',
    diagnosis: initialData.diagnosis || '', symptoms: initialData.symptoms || '', blood_group: initialData.blood_group || 'Unknown',
    attending_doctor: initialData.attending_doctor || '', address: initialData.address || '',
    assigned_bed_id: initialData.assigned_bed_id?._id || initialData.assigned_bed_id || '', phone: initialData.phone || ''
  } : {
    name: '', age: '', gender: 'Male', diagnosis: '', blood_group: 'Unknown',
    attending_doctor: '', address: '', assigned_bed_id: '', phone: '', symptoms: ''
  });
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');

  const availableBeds = beds.filter(b => b.status === 'Available');
  const presentDoctors = (doctors || []).filter(d => d.today_status === 'Present');

  const runAITriage = async () => {
    if (!form.symptoms) {
      setError('Please describe symptoms for AI Triage');
      return;
    }
    setAiLoading(true);
    setError('');
    
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        // Fallback simulation if no API key provided
        await new Promise(r => setTimeout(r, 1500));
        let diagnosis = 'Viral Infection';
        if (form.symptoms.toLowerCase().includes('chest')) diagnosis = 'Suspected Heart Issue';
        
        const doc = presentDoctors.length > 0 ? presentDoctors[0].name : '';
        setForm(p => ({ ...p, diagnosis, attending_doctor: doc }));
      } else {
        // Actual Gemini API call
        const prompt = `You are an expert AI Triage Assistant. Based on these symptoms: "${form.symptoms}". 
          Available Doctors today: ${presentDoctors.map(d => d.name + ' (' + d.specialization + ')').join(', ')}.
          Respond strictly in JSON format: {"diagnosis": "...", "recommended_doctor": "..."}. Do not use markdown blocks.`;
          
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error?.message || 'Invalid API Key or API Error');
        }

        const text = data.candidates[0].content.parts[0].text;
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        
        setForm(p => ({ ...p, diagnosis: parsed.diagnosis, attending_doctor: parsed.recommended_doctor || '' }));
      }
    } catch (err) {
      console.error('AI Triage Error:', err);
      setError(`AI Triage failed: ${err.message || 'Please fill manually'}`);
    } finally {
      setAiLoading(false);
    }
  };

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
      if (initialData) {
        await onAdmit(initialData._id, payload);
      } else {
        await onAdmit(payload);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${initialData ? 'update' : 'admit'} patient`);
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
        <div className="sticky top-0 glass-card rounded-b-none p-5 border-b border-white/10 flex items-center justify-between z-10">
          <h3 className="section-title">
            <UserPlus className="w-5 h-5 text-primary-400" />
            {initialData ? t('editPatientDetails') : t('admitPatient')}
          </h3>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>}

          {/* AI Triage Section */}
          <div className="bg-accent-500/10 border border-accent-500/30 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-accent-400 flex items-center gap-2">
                <Brain className="w-4 h-4" /> {t('aiSmartTriage')}
              </label>
            </div>
            <textarea
              value={form.symptoms}
              onChange={e => setForm(p => ({ ...p, symptoms: e.target.value }))}
              placeholder="Describe symptoms here (e.g., severe chest pain, fever for 3 days)..."
              className="input-glass w-full text-sm mb-3 min-h-[60px]"
            />
            <button
              type="button"
              onClick={runAITriage}
              disabled={aiLoading}
              className="w-full py-2 rounded-lg bg-accent-500/20 text-accent-400 hover:bg-accent-500/30 border border-accent-500/50 transition-all font-medium text-sm flex items-center justify-center gap-2"
            >
              {aiLoading ? <div className="w-4 h-4 border-2 border-accent-400 border-t-transparent rounded-full animate-spin" /> : <Brain className="w-4 h-4" />}
              {aiLoading ? t('analyzingSymptoms') : t('runAiTriage')}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {fields('name', `${t('patientName')} *`, 'text', { placeholder: 'Full Name', required: true })}
              {fields('age', `${t('age')} *`, 'number', { placeholder: '25', min: 0, max: 150, required: true })}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-white/60 mb-1.5">{t('gender')}</label>
                <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))} className="input-glass">
                  <option className="text-slate-800">Male</option>
                  <option className="text-slate-800">Female</option>
                  <option className="text-slate-800">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1.5">{t('bloodGroup')}</label>
                <select value={form.blood_group} onChange={e => setForm(p => ({ ...p, blood_group: e.target.value }))} className="input-glass">
                  {['Unknown','A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => <option key={g} className="text-slate-800">{g}</option>)}
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
                <option value="" className="text-slate-800">{t('selectDoctor')}</option>
                {presentDoctors.map(d => <option key={d._id} value={d.name} className="text-slate-800">{d.name} ({d.specialization})</option>)}
              </select>
              {presentDoctors.length === 0 && (
                <div className="text-xs text-red-400 mt-1">No doctors currently present!</div>
              )}
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-1.5">{t('assignBedOpt')}</label>
              <select value={form.assigned_bed_id} onChange={e => setForm(p => ({ ...p, assigned_bed_id: e.target.value }))} className="input-glass">
                <option value="" className="text-slate-800">{t('noBedAssigned')}</option>
                {availableBeds.map(b => <option key={b._id} value={b._id} className="text-slate-800">{b.bed_number} ({b.ward})</option>)}
              </select>
            </div>

            {fields('address', t('address'), 'text', { placeholder: 'Village, District' })}
            {fields('phone', t('phone'), 'tel', { placeholder: '9876543210' })}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-glass flex-1">{t('cancel')}</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {initialData ? t('save') : t('admitPatient')}
              </button>
            </div>
          </form>
        </div>
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

// ── Logistics Tab ─────────────────────────────────────────────────────────
function LogisticsTab({ hospitalId }) {
  const { getTransfers, dispatchTransfer, receiveTransfer, t } = useSmartHealth();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const data = await getTransfers(hospitalId);
      setTransfers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <div className="p-8 text-center text-white/50">Loading transfers...</div>;

  return (
    <div className="glass-card p-6">
      <h2 className="section-title mb-6">
        <Package className="w-5 h-5 text-purple-400" />
        {t('interHospitalTransfers')}
      </h2>
      <div className="space-y-4">
        {transfers.length === 0 ? (
          <div className="text-center text-white/40 p-8">{t('noActiveTransfers')}</div>
        ) : transfers.map(t => {
          const isSender = t.from_hospital._id === hospitalId;
          const isReceiver = t.to_hospital._id === hospitalId;
          return (
            <div key={t._id} className="glass-card-sm p-4 flex items-center justify-between border border-white/5">
              <div>
                <div className="text-lg font-bold text-white">{t.item_name} <span className="text-sm text-primary-400">({t.quantity} units)</span></div>
                <div className="text-sm text-white/50 mt-1">
                  From: {t.from_hospital.name} ➔ To: {t.to_hospital.name}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`badge-neutral ${t.status === 'In-Transit' ? 'bg-orange-500/20 text-orange-400' : t.status === 'Received' ? 'bg-emerald-500/20 text-emerald-400' : ''}`}>
                  {t.status}
                </span>
                {isSender && t.status === 'Pending' && (
                  <button onClick={async () => { 
                    try {
                      await dispatchTransfer(t._id); 
                      loadData(); 
                    } catch(err) {
                      alert(err.response?.data?.message || 'Failed to dispatch');
                    }
                  }} className="btn-primary text-sm py-1.5 px-4">{t('dispatch')}</button>
                )}
                {isReceiver && t.status === 'In-Transit' && (
                  <button onClick={async () => { 
                    try {
                      await receiveTransfer(t._id); 
                      loadData(); 
                    } catch(err) {
                      alert(err.response?.data?.message || 'Failed to receive');
                    }
                  }} className="btn-primary text-sm py-1.5 px-4">{t('receive')}</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Referrals Tab ─────────────────────────────────────────────────────────
function ReferralsTab({ hospitalId, isCHC, allHospitals = [], patients = [] }) {
  const { getReferrals, createReferral, acceptReferral, t } = useSmartHealth();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // For PHC creating a referral
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patient_name: '', patient_age: '', patient_gender: 'Male', reason: '', to_hospital: '' });

  const loadData = useCallback(async () => {
    try {
      const data = await getReferrals(hospitalId);
      setReferrals(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createReferral({ ...form, from_hospital: hospitalId });
    setShowForm(false);
    loadData();
  };

  if (loading) return <div className="p-8 text-center text-white/50">Loading referrals...</div>;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="section-title">
          <Activity className="w-5 h-5 text-accent-400" />
          {isCHC ? t('incomingReferrals') : t('patientReferrals')}
        </h2>
        {!isCHC && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> {t('newReferral')}
          </button>
        )}
      </div>

      {showForm && !isCHC && (
        <form onSubmit={handleSubmit} className="glass-card-sm p-4 mb-6 space-y-4 border border-accent-500/30">
          <h3 className="font-bold text-accent-400">{t('newReferral')}</h3>
          <div className="grid grid-cols-2 gap-3">
            <select 
              required 
              className="input-glass" 
              onChange={e => {
                const p = patients.find(pat => pat._id === e.target.value);
                if (p) {
                  setForm(prev => ({...prev, patient_name: p.name, patient_age: p.age, patient_gender: p.gender}));
                }
              }}
            >
              <option value="" className="text-black">{t('selectAdmittedPatient')}</option>
              {patients.map(p => (
                <option key={p._id} value={p._id} className="text-black">{p.name} ({p.age}y / {p.gender}) - {p.diagnosis}</option>
              ))}
            </select>
            <select required className="input-glass" value={form.to_hospital} onChange={e => setForm(p => ({...p, to_hospital: e.target.value}))}>
              <option value="" className="text-black">{t('selectChc')}</option>
              {allHospitals.filter(h => h.type === 'CHC').map(h => (
                <option key={h._id} value={h._id} className="text-black">{h.name}</option>
              ))}
            </select>
          </div>
          <input required placeholder={t('reasonForReferral')} className="input-glass" value={form.reason} onChange={e => setForm(p => ({...p, reason: e.target.value}))} />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="btn-glass px-4 py-2 text-sm">{t('cancel')}</button>
            <button type="submit" className="btn-primary px-4 py-2 text-sm">{t('submitReferral')}</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {referrals.length === 0 ? (
          <div className="text-center text-white/40 p-8">{t('noActiveReferrals')}</div>
        ) : referrals.map(r => {
          const isReceiver = r.to_hospital._id === hospitalId;
          return (
            <div key={r._id} className="glass-card-sm p-4 border border-white/5 relative overflow-hidden">
              {r.status === 'Pending' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500" />}
              {r.status === 'Accepted' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />}
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-lg font-bold text-white">{r.patient_name} <span className="text-sm font-normal text-white/50">({r.patient_age}y / {r.patient_gender})</span></div>
                  <div className="text-sm text-white/70 mt-1">Reason: <span className="text-white">{r.reason}</span></div>
                  <div className="text-xs text-white/40 mt-1">From: {r.from_hospital.name} ➔ To: {r.to_hospital.name}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`badge-neutral ${r.status === 'Accepted' ? 'bg-emerald-500/20 text-emerald-400' : ''}`}>{r.status}</span>
                  {isCHC && isReceiver && r.status === 'Pending' && (
                    <button onClick={async () => { await acceptReferral(r._id); loadData(); }} className="btn-primary text-sm py-1.5 px-4">{t('acceptPatient')}</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Hospital Dashboard ────────────────────────────────────────────────────
export default function HospitalDashboard() {
  const { t, hospitalId, getPHCDashboard, admitPatient, updatePatient, dischargePatient, updateInventory, restockInventory, requestRestock, logStockUsage, getDoctors, resolveAlert, logAttendance, socket, getHospitals } = useSmartHealth();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdmit, setShowAdmit] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [showAttendance, setShowAttendance] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [allHospitals, setAllHospitals] = useState([]);

  const loadData = useCallback(async () => {
    if (!hospitalId) return;
    try {
      const d = await getPHCDashboard(hospitalId);
      setData(d);
      
      const docs = await getDoctors(hospitalId);
      setDoctors(docs);
      
      const hs = await getHospitals();
      setAllHospitals(hs);
    } catch (err) {
      console.error('Failed to load Hospital data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hospitalId]);

  useEffect(() => { loadData(); }, [loadData, activeTab]);

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

  const handleUpdatePatient = async (id, formData) => {
    await updatePatient(id, formData);
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <FootfallChart />
              <div className="glass-card p-5">
                <h3 className="section-title mb-4">
                  <Brain className="w-5 h-5 text-accent-500" />
                  {t('aiTitle') || 'AI Demand Forecasts'}
                </h3>
                <StockForecastPanel predictions={data?.forecasts} isLoading={!data} />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <StatCard label={t('availableBeds')} value={data?.bed_summary?.available ?? 0} icon={BedDouble} color="bg-primary-500/20 text-primary-400" subtext={`of ${data?.bed_summary?.total ?? 0} total`} delay={0} />
              <StatCard label={t('totalPatients')} value={data?.patients?.length ?? 0} icon={Users} color="bg-blue-500/20 text-blue-400" subtext="Currently admitted" delay={0.05} />
              <StatCard label={t('criticalStock')} value={data?.inventory_summary?.critical ?? 0} icon={Package} color="bg-red-500/20 text-red-400" subtext="Out of stock" delay={0.1} />
            </div>

            {/* Quick actions */}
            <div className="flex gap-2 sm:gap-3 flex-wrap">
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

            {/* Bed summary */}
            <div className="glass-card p-5">
              <h3 className="section-title mb-4">
                <BedDouble className="w-5 h-5 text-primary-400" />
                {t('bedManagement')}
              </h3>
              <BedGrid beds={data?.beds || []} onDischarge={async (patientId) => { await dischargePatient(patientId); loadData(); }} />
            </div>
          </div>
        );

      case 'beds':
        return (
          <div className="glass-card p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-6">
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
          <div className="glass-card p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-6">
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
                    <th>{t('attendingDoctor')}</th>
                    <th>{t('beds')}</th>
                    <th>{t('admittedDate')}</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.patients || []).map(p => (
                    <tr key={p._id}>
                      <td className="font-mono text-xs text-white/50">{p.patient_id}</td>
                      <td className="font-semibold text-white">{p.name}</td>
                      <td className="text-white/60">{p.age}y / {p.gender}</td>
                      <td>
                        <div className="badge-neutral mb-1">{p.diagnosis}</div>
                        <div className="text-[10px] text-white/40 truncate max-w-[150px]" title={p.symptoms}>{p.symptoms || '—'}</div>
                      </td>
                      <td className="text-white/60 text-sm">{p.attending_doctor || '—'}</td>
                      <td className="text-white/60 font-semibold">
                        {p.assigned_bed_id ? (
                          <span className="badge-primary">{p.assigned_bed_id.bed_number} ({p.assigned_bed_id.ward})</span>
                        ) : '—'}
                      </td>
                      <td className="text-white/50 text-xs">{new Date(p.admitted_date).toLocaleDateString('en-IN')}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setEditingPatient(p)}
                            className="btn-glass text-xs py-1 px-3 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
                          >
                            {t('edit')}
                          </button>
                          <button 
                            onClick={async () => {
                              if (window.confirm(`Discharge ${p.name}? This will free up their bed automatically.`)) {
                                await dischargePatient(p._id);
                                loadData();
                              }
                            }}
                            className="btn-glass text-xs py-1 px-3 border-red-500/30 text-red-400 hover:bg-red-500/20"
                          >
                            {t('dischargePatient')}
                          </button>
                        </div>
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
          <div className="glass-card p-4 sm:p-6">
            <h2 className="section-title mb-4 sm:mb-6">
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
              onLogUsage={async (id, d) => {
                await logStockUsage(id, d);
                loadData();
              }}
              forecasts={data?.forecasts || []}
              patients={data?.patients || []}
              doctors={doctors || []}
            />
          </div>
        );

      case 'lab_tests':
        return (
          <div className="glass-card p-6">
            <LabTestsTable />
          </div>
        );


      case 'attendance':
        return (
          <AttendanceSystem />
        );

      case 'logistics':
        return <LogisticsTab hospitalId={hospitalId} />;

      case 'referrals':
        return <ReferralsTab hospitalId={hospitalId} isCHC={data?.hospital?.type === 'CHC'} allHospitals={allHospitals} patients={data?.patients || []} />;

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={false} unreadAlerts={unreadAlerts} />

      <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6 pl-14 lg:pl-0"
        >
          <div className="flex flex-wrap items-start gap-3 justify-between">
            <div>
              <h1 className="text-lg sm:text-2xl font-bold font-display text-white">{data?.hospital?.name || 'PHC Dashboard'}</h1>
              <p className="text-xs sm:text-sm text-white/40">{data?.hospital?.type} • {data?.hospital?.district} • {data?.hospital?.location?.village}</p>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <div className="flex items-center gap-2">
                <span className="pulse-dot" />
                <span className="text-xs text-white/40">Live</span>
              </div>
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
        {editingPatient && <AdmitPatientModal beds={data?.beds || []} doctors={doctors} hospitalId={hospitalId} onClose={() => setEditingPatient(null)} onAdmit={handleUpdatePatient} initialData={editingPatient} />}
        {showAttendance && <AttendanceForm hospitalId={hospitalId} hospital={data?.hospital} onLog={handleLogAttendance} onClose={() => setShowAttendance(false)} />}
      </AnimatePresence>
    </div>
  );
}
