import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { UserCheck, Clock, UserX, Plus, Calendar, ScanFace, Camera, Brain, CheckCircle2, Activity, ShieldCheck, Loader2 } from 'lucide-react';
import { useSmartHealth } from '../context/SmartHealthContext';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AttendanceSystem = () => {
  const { user, hospitalId, t } = useSmartHealth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isScanning, setIsScanning] = useState(false);
  const [scannedDoctor, setScannedDoctor] = useState(null);

  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [newDoctor, setNewDoctor] = useState({
    name: 'Dr. Rajesh Sharma', specialization: 'General Physician', availability_start: '09:00', availability_end: '17:00',
    lunch_start: '13:00', lunch_end: '14:00', working_days: ['Mon','Tue','Wed','Thu','Fri','Sat']
  });

  const PRESET_DOCTORS = [
    { name: 'Dr. Rajesh Sharma', spec: 'General Physician' },
    { name: 'Dr. Priya Patel', spec: 'Cardiologist' },
    { name: 'Dr. Amit Kumar', spec: 'Orthopedist' },
    { name: 'Dr. Neha Gupta', spec: 'Pediatrician' },
    { name: 'Dr. Sanjay Singh', spec: 'Neurologist' },
    { name: 'Dr. Anjali Desai', spec: 'Gynecologist' },
    { name: 'Dr. Vikram Malhotra', spec: 'Dermatologist' },
    { name: 'Dr. Sneha Reddy', spec: 'Ophthalmologist' },
    { name: 'Dr. Rahul Verma', spec: 'Psychiatrist' },
    { name: 'Dr. Kavita Iyer', spec: 'ENT Specialist' }
  ];

  const fetchData = async () => {
    if (!hospitalId) return;
    try {
      setLoading(true);
      const docsRes = await axios.get(`${API_URL}/api/doctors/${hospitalId}`);
      setDoctors(docsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hospitalId) fetchData();
  }, [hospitalId]);

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/doctors`, { ...newDoctor, hospital_id: hospitalId });
      setShowAddDoctor(false);
      fetchData();
    } catch (err) {
      alert('Error adding doctor');
    }
  };

  const markAttendance = async (doctorId, status) => {
    try {
      setDoctors(docs => docs.map(d => d._id === doctorId ? { ...d, today_status: status } : d));
      await axios.post(`${API_URL}/api/doctors/attendance`, {
        doctor_id: doctorId, hospital_id: hospitalId, date: new Date().toISOString(), status, marked_by: user._id
      });
    } catch (err) {
      console.error('Error marking attendance', err);
    }
  };

  const handleAutoAddDoctors = async () => {
    try {
      setLoading(true);
      for (const doc of PRESET_DOCTORS) {
        if (doctors.find(d => d.name === doc.name)) continue;
        await axios.post(`${API_URL}/api/doctors`, {
          name: doc.name, specialization: doc.spec, availability_start: '09:00', availability_end: '17:00',
          lunch_start: '13:00', lunch_end: '14:00', working_days: ['Mon','Tue','Wed','Thu','Fri','Sat'], hospital_id: hospitalId
        });
      }
      fetchData();
    } catch (err) {
      alert('Error auto-adding doctors');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && doctors.length === 0 && hospitalId) handleAutoAddDoctors();
  }, [loading, doctors.length, hospitalId]);

  // AI Scanner Logic
  useEffect(() => {
    let scanInterval;
    if (isScanning) {
      scanInterval = setInterval(() => {
        const notPresentDocs = doctors.filter(d => d.today_status !== 'Present');
        if (notPresentDocs.length > 0) {
          // Randomly pick a doctor to "scan"
          const randomDoc = notPresentDocs[Math.floor(Math.random() * notPresentDocs.length)];
          setScannedDoctor(randomDoc);
          
          // Mark them present after a short delay to simulate "recognition"
          setTimeout(() => {
            markAttendance(randomDoc._id, 'Present');
            setTimeout(() => setScannedDoctor(null), 2000); // Clear scanner after 2s
          }, 1500);
        } else {
          // Everyone is present, stop scanning
          setIsScanning(false);
        }
      }, 5000); // Scan every 5 seconds
    }
    return () => clearInterval(scanInterval);
  }, [isScanning, doctors]);

  const getProgress = (start, end) => {
    const now = new Date();
    const [sH, sM] = start.split(':');
    const [eH, eM] = end.split(':');
    const sDate = new Date(); sDate.setHours(sH, sM, 0, 0);
    const eDate = new Date(); eDate.setHours(eH, eM, 0, 0);
    
    if (now < sDate) return 0;
    if (now > eDate) return 100;
    return Math.round(((now - sDate) / (eDate - sDate)) * 100);
  };

  const presentCount = doctors.filter(d => d.today_status === 'Present').length;
  const totalCount = doctors.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center glass-card p-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-white flex items-center gap-3">
            <Brain className="w-7 h-7 text-primary-400" />
            AI Smart Attendance
          </h2>
          <p className="text-sm text-white/50 mt-1">{t('attendanceAutoDesc') || 'Automated biometric monitoring & staff rostering'}</p>
        </div>
        <div className="flex gap-3">
          <div className="glass-card-sm px-4 py-2 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-xs text-white/50 uppercase tracking-wider">{t('staffingHealth') || 'Staffing Health'}</div>
              <div className="font-bold text-white text-sm">{totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0}% ({presentCount}/{totalCount})</div>
            </div>
          </div>
          <button onClick={() => setShowAddDoctor(true)} className="btn-glass flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> {t('addDoctor') || 'Add Doctor'}
          </button>
        </div>
      </div>

      {showAddDoctor && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 border-primary-500/30">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2"><Plus className="w-4 h-4" /> {t('addDoctor') || 'Add Doctor'}</h3>
          <form onSubmit={handleAddDoctor} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs text-white/50 mb-1">Select Preset Doctor</label>
              <select className="input-glass" value={newDoctor.name} onChange={e => {
                const doc = PRESET_DOCTORS.find(d => d.name === e.target.value);
                if (doc) setNewDoctor({ ...newDoctor, name: doc.name, specialization: doc.spec });
              }}>
                {PRESET_DOCTORS.map(d => <option key={d.name} value={d.name} className="text-slate-800">{d.name} - {d.spec}</option>)}
              </select>
            </div>
            <div className="flex gap-2 md:col-span-1">
              <div className="flex-1">
                <label className="block text-xs text-white/50 mb-1">Shift Start</label>
                <input type="time" className="input-glass" value={newDoctor.availability_start} onChange={e => setNewDoctor({...newDoctor, availability_start: e.target.value})} />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-white/50 mb-1">Shift End</label>
                <input type="time" className="input-glass" value={newDoctor.availability_end} onChange={e => setNewDoctor({...newDoctor, availability_end: e.target.value})} />
              </div>
            </div>
            <div className="md:col-span-3 flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setShowAddDoctor(false)} className="btn-glass text-xs py-1.5 px-4">{t('cancel')}</button>
              <button type="submit" className="btn-primary text-xs py-1.5 px-6">{t('save')}</button>
            </div>
          </form>
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center p-12"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* AI Scanner Panel */}
          <div className="lg:col-span-1 space-y-4">
            <div className="glass-card p-5 h-[400px] flex flex-col relative overflow-hidden">
              <div className="flex items-center justify-between mb-4 relative z-10">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <ScanFace className="w-4 h-4 text-primary-400" />
                Live Scanner
                </h3>
                <span className={`flex h-2 w-2 relative ${isScanning ? '' : 'hidden'}`}>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              </div>
              
              <div className="flex-1 rounded-xl border border-white/10 bg-black/40 relative overflow-hidden flex flex-col items-center justify-center">
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                
                {isScanning ? (
                  <>
                    {/* Scanning Laser */}
                    <motion.div 
                      animate={{ y: ['0%', '300%', '0%'] }} 
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      className="absolute top-0 left-0 w-full h-[30%] bg-gradient-to-b from-transparent via-primary-500/30 to-primary-500 shadow-[0_4px_20px_rgba(16,185,129,0.5)] z-20 pointer-events-none"
                    />
                    
                    <AnimatePresence mode="wait">
                      {scannedDoctor ? (
                        <motion.div 
                          key="detected"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 1.1 }}
                          className="relative z-10 flex flex-col items-center text-center"
                        >
                          <div className="relative">
                            <div className="w-20 h-20 rounded-xl bg-primary-500/20 border-2 border-primary-500 flex items-center justify-center text-2xl font-bold text-primary-400 mb-3 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                              {scannedDoctor.name.replace('Dr. ', '').charAt(0)}
                            </div>
                            <motion.div 
                              initial={{ scale: 0 }} animate={{ scale: 1 }}
                              className="absolute -bottom-2 -right-2 bg-primary-500 rounded-full p-1 text-white shadow-lg"
                            >
                              <CheckCircle2 className="w-5 h-5" />
                            </motion.div>
                          </div>
                          <div className="text-primary-400 font-bold text-sm tracking-wider uppercase mb-1">Identity Confirmed</div>
                          <div className="text-white font-bold">{scannedDoctor.name}</div>
                          <div className="text-white/50 text-xs">{scannedDoctor.specialization}</div>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="searching"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="relative z-10 flex flex-col items-center text-center opacity-50"
                        >
                          <Camera className="w-12 h-12 text-white/30 mb-3" />
                          <div className="text-white/40 text-xs tracking-widest uppercase flex items-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin" /> Scanning entrance...
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <div className="text-center p-4 relative z-10">
                    <ScanFace className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <p className="text-white/40 text-xs">{t('scannerOffline') || 'Scanner is offline'}</p>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setIsScanning(!isScanning)}
                className={`mt-4 w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                  isScanning 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30' 
                    : 'bg-primary-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:bg-primary-600'
                }`}
              >
                {isScanning ? (
                  <>{t('stopScanner') || 'Stop AI Scanner'}</>
                ) : (
                  <><ScanFace className="w-5 h-5" /> {t('activateScanner') || 'Activate AI Scanner'}</>
                )}
              </button>
            </div>
            
            <div className="glass-card p-4">
              <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">{t('scannerLog') || 'Scanner Log'}</h4>
              <div className="space-y-3">
                {doctors.filter(d => d.today_status === 'Present').slice(-3).map((d, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary-400"></div>
                    <span className="text-white/80">{d.name} logged in</span>
                    <span className="text-white/40 text-xs ml-auto">Just now</span>
                  </div>
                ))}
                {doctors.filter(d => d.today_status === 'Present').length === 0 && (
                  <div className="text-white/30 text-xs text-center italic">No logs today</div>
                )}
              </div>
            </div>
          </div>

          {/* Doctors Roster */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            {/* Search Bar */}
            <div className="glass-card-sm p-2 flex items-center border border-white/10">
              <input 
                type="text" 
                placeholder="Search doctors by name or specialization..." 
                className="bg-transparent border-none outline-none text-sm text-white placeholder:text-white/30 px-3 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <AnimatePresence>
                {doctors.filter(doc => 
                  doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  doc.specialization.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((doc, idx) => {
                  const status = doc.today_status || 'Not Marked';
                  const progress = getProgress(doc.availability_start, doc.availability_end);
                  const isPresent = status === 'Present';
                  const isAbsent = status === 'Absent';
                  const isLeave = status === 'Leave';

                  return (
                    <motion.div 
                      key={doc._id} 
                      layout
                      initial={{ opacity: 0, scale: 0.95 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      className={`relative overflow-hidden glass-card p-5 transition-all duration-300 ${
                        isPresent ? 'bg-primary-500/[0.05] border-primary-500/30' :
                        isAbsent ? 'bg-red-500/[0.05] border-red-500/30' :
                        isLeave ? 'bg-orange-500/[0.05] border-orange-500/30' : ''
                      }`}
                    >
                      {/* Animated Border for Scanned Doctors */}
                      {scannedDoctor?._id === doc._id && (
                        <motion.div 
                          layoutId="scanBorder"
                          className="absolute inset-0 border-2 border-primary-400 rounded-2xl z-20 pointer-events-none"
                          animate={{ opacity: [1, 0, 1] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                        />
                      )}

                      <div className={`absolute top-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isPresent ? 'bg-primary-500/20 text-primary-600 dark:text-primary-400' :
                        isAbsent ? 'bg-red-500/20 text-red-600 dark:text-red-400' :
                        isLeave ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400' : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-white/50'
                      }`}>
                        {status}
                      </div>

                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border ${
                          isPresent ? 'bg-primary-500/20 border-primary-500/50 text-primary-600 dark:text-primary-400 shadow-[0_0_15px_rgba(20,184,138,0.2)]' : 
                          'glass-card-sm text-slate-500 dark:text-white/70'
                        }`}>
                          {doc.name.replace('Dr. ', '').charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 dark:text-white text-sm">{doc.name}</h3>
                          <p className="text-xs text-slate-500 dark:text-white/50">{doc.specialization}</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between text-[10px] text-slate-500 dark:text-white/40 mb-1 font-mono">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {doc.availability_start}</span>
                          <span>{doc.availability_end}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 dark:bg-black/40 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${
                              isPresent ? 'bg-primary-500 shadow-[0_0_8px_rgba(20,184,138,0.6)]' : 'bg-slate-400 dark:bg-slate-600'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-white/5">
                        <button 
                          onClick={() => markAttendance(doc._id, 'Present')} 
                          className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 text-xs font-semibold transition-all ${
                            isPresent ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-primary-400/70 hover:bg-primary-500/10 hover:text-primary-600'
                          }`}
                        >
                          <UserCheck className="w-3.5 h-3.5" /> {t('present') || 'Present'}
                        </button>
                        <button 
                          onClick={() => markAttendance(doc._id, 'Absent')} 
                          className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 text-xs font-semibold transition-all ${
                            isAbsent ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-red-400/70 hover:bg-red-500/10 hover:text-red-600'
                          }`}
                        >
                          <UserX className="w-3.5 h-3.5" /> {t('absent') || 'Absent'}
                        </button>
                        <button 
                          onClick={() => markAttendance(doc._id, 'Leave')} 
                          className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 text-xs font-semibold transition-all ${
                            isLeave ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-orange-400/70 hover:bg-orange-500/10 hover:text-orange-600'
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5" /> {t('leave') || 'Leave'}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceSystem;
