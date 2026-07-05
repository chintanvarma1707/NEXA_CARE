import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BedDouble, User, Calendar, Stethoscope, Droplets,
  X, CheckCircle2, Clock, AlertTriangle
} from 'lucide-react';
import { useSmartHealth } from '../context/SmartHealthContext';

const STATUS_COLORS = {
  Available: 'border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 hover:border-emerald-500',
  Occupied: 'border-red-500/40 bg-red-500/10 hover:bg-red-500/20 border-red-500 cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.1)]',
  Maintenance: 'border-yellow-500/40 bg-yellow-500/10 opacity-80',
  Reserved: 'border-blue-500/40 bg-blue-500/10',
};

const STATUS_DOT = {
  Available: 'bg-emerald-400',
  Occupied: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]',
  Maintenance: 'bg-yellow-400',
  Reserved: 'bg-blue-400',
};

function PatientModal({ patient, bed, onClose, onDischarge }) {
  const { t } = useSmartHealth();
  const [showConfirm, setShowConfirm] = useState(false);
  if (!patient) return null;

  const days = Math.floor((new Date() - new Date(patient.admitted_date)) / 86400000);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        className="bg-white dark:bg-[#0c1a3f] border border-slate-200 dark:border-white/10 w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 border-b border-red-100 dark:border-white/10 bg-red-50/50 dark:bg-red-500/5">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:text-white/40 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 flex items-center justify-center">
              <User className="w-7 h-7 text-red-500 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white font-display">{patient.name}</h3>
              <p className="text-sm text-slate-500 dark:text-white/50 font-mono">{patient.patient_id}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 flex items-center gap-1.5 border border-red-200 dark:border-red-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Occupied — {bed?.bed_number}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/70 border border-slate-200 dark:border-white/10">
              {bed?.ward}
            </span>
          </div>
        </div>

        {/* Patient details */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: t('age'), value: `${patient.age} years`, icon: User },
              { label: t('gender'), value: patient.gender, icon: User },
              { label: t('bloodGroup'), value: patient.blood_group || 'Unknown', icon: Droplets },
              { label: t('daysAdmitted') || 'Days Admitted', value: `${days} day${days !== 1 ? 's' : ''}`, icon: Clock },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl p-3">
                <p className="text-xs text-slate-400 dark:text-white/40 font-semibold mb-1">{label}</p>
                <p className="text-sm font-bold text-slate-700 dark:text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="bg-orange-50 dark:bg-orange-500/5 border border-orange-100 dark:border-orange-500/10 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Stethoscope className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-orange-600/70 dark:text-orange-400/70 font-semibold mb-1">{t('diagnosis')}</p>
                <p className="text-base font-bold text-slate-800 dark:text-white">{patient.diagnosis}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl p-3">
              <p className="text-xs text-slate-400 dark:text-white/40 font-semibold mb-1">{t('admittedDate')}</p>
              <p className="text-sm font-bold text-slate-700 dark:text-white">
                {new Date(patient.admitted_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl p-3">
              <p className="text-xs text-slate-400 dark:text-white/40 font-semibold mb-1">{t('attendingDoctor')}</p>
              <p className="text-sm font-bold text-slate-700 dark:text-white">{patient.attending_doctor || '—'}</p>
            </div>
          </div>

          <div className="pt-4">
            {showConfirm ? (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-4 text-center"
              >
                <p className="text-sm text-red-800 dark:text-red-200 font-bold mb-4">Are you sure you want to discharge {patient.name}?</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowConfirm(false)} className="flex-1 bg-white dark:bg-transparent text-slate-700 dark:text-white border border-slate-200 dark:border-white/20 hover:bg-slate-50 dark:hover:bg-white/5 py-2 rounded-lg font-bold transition-colors">
                    {t('cancel')}
                  </button>
                  <button 
                    onClick={async () => {
                      const success = await onDischarge(patient._id, patient.name, bed.bed_number);
                      if (success) onClose();
                    }} 
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-bold shadow-lg transition-colors"
                  >
                    {t('confirmDischarge') || 'Confirm Discharge'}
                  </button>
                </div>
              </motion.div>
            ) : (
              <button 
                onClick={() => setShowConfirm(true)} 
                className="w-full bg-white dark:bg-transparent text-slate-700 dark:text-white border-2 border-slate-200 dark:border-white/20 hover:border-slate-300 dark:hover:border-white/40 hover:bg-slate-50 dark:hover:bg-white/5 font-bold py-3 rounded-xl transition-all shadow-sm"
              >
                {t('dischargePatient')}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function BedGrid({ beds = [], onBedUpdate, onAssignClick, onDischarge }) {
  const { t } = useSmartHealth();
  const [selectedBed, setSelectedBed] = useState(null);
  const [toast, setToast] = useState(null);

  // Group beds by category (ward)
  const groupedBeds = beds.reduce((acc, bed) => {
    const w = bed.ward || 'General';
    if (!acc[w]) acc[w] = [];
    acc[w].push(bed);
    return acc;
  }, {});

  const handleDischarge = async (patientId, patientName, bedNumber) => {
    try {
      await onDischarge(patientId);
      const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      setToast({
        type: 'success',
        title: 'Discharge Successful',
        message: `Patient ${patientName} discharged on ${dateStr}. Bed ${bedNumber} is now Available.`
      });
      setTimeout(() => setToast(null), 5000);
      return true;
    } catch (err) {
      console.error(err);
      setToast({
        type: 'error',
        title: 'Discharge Failed',
        message: err.response?.data?.message || err.message || 'You do not have permission to discharge patients.'
      });
      setTimeout(() => setToast(null), 5000);
      return false; // Return false so modal doesn't close
    }
  };

  const handleBedClick = (bed) => {
    if (bed.status === 'Occupied') setSelectedBed(bed);
    else if (bed.status === 'Available' && onAssignClick) onAssignClick(bed);
  };

  const WARD_ORDER = ['Emergency', 'ICU', 'Trauma', 'NICU', 'General', 'Deluxe', 'Super Deluxe'];
  const sortedWards = Object.keys(groupedBeds).sort((a, b) => {
    const ia = WARD_ORDER.indexOf(a);
    const ib = WARD_ORDER.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className={`fixed top-24 left-1/2 -translate-x-1/2 z-[60] border-2 p-4 rounded-2xl shadow-2xl flex items-start gap-4 max-w-md w-full ${
              toast.type === 'error' 
                ? 'bg-red-50 dark:bg-red-900/90 border-red-500 text-red-900 dark:text-red-100 shadow-[0_10px_40px_rgba(239,68,68,0.3)]' 
                : 'bg-emerald-50 dark:bg-emerald-900/90 border-emerald-500 text-emerald-900 dark:text-emerald-100 shadow-[0_10px_40px_rgba(16,185,129,0.3)]'
            }`}
          >
            <div className={`p-2 rounded-full flex-shrink-0 ${toast.type === 'error' ? 'bg-red-100 dark:bg-red-500/20' : 'bg-emerald-100 dark:bg-emerald-500/20'}`}>
              {toast.type === 'error' ? <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" /> : <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
            </div>
            <div className="flex-1 pt-0.5">
              <h4 className="font-bold text-base mb-1">{toast.title}</h4>
              <p className="text-sm opacity-90 leading-relaxed">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-8 pb-10">
        {sortedWards.map(wardName => {
          const wardBeds = groupedBeds[wardName];
          const total = wardBeds.length;
          const occupied = wardBeds.filter(b => b.status === 'Occupied').length;
          const avail = wardBeds.filter(b => b.status === 'Available').length;
          const percentage = total > 0 ? (occupied / total) * 100 : 0;
          
          return (
            <div key={wardName} className="glass-card bg-white/50 dark:bg-[#081229]/50 overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm">
              <div className="px-6 py-5 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center text-primary-600 dark:text-primary-400">
                    <BedDouble className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-display text-slate-800 dark:text-white">{wardName} {t('ward') || 'Ward'}</h3>
                    <p className="text-sm text-slate-500 dark:text-white/50 font-medium">{t('totalBeds')}: {total}</p>
                  </div>
                </div>
                
                <div className="flex flex-col flex-1 max-w-sm sm:ml-auto">
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-slate-600 dark:text-white/70">{t('occupancyRate')}</span>
                    <span className={percentage >= 90 ? 'text-red-500' : 'text-emerald-500'}>{Math.round(percentage)}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden flex">
                    <div 
                      className={`h-full transition-all duration-1000 ease-out ${percentage >= 90 ? 'bg-red-500' : 'bg-emerald-500'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-2 font-semibold">
                    <span className="text-emerald-600 dark:text-emerald-400">{avail} {t('bedAvailable')}</span>
                    <span className="text-red-600 dark:text-red-400">{occupied} {t('bedOccupied')}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4">
                  {wardBeds.map(bed => {
                    const isOccupied = bed.status === 'Occupied';
                    const patient = bed.current_patient_id;
                    
                    return (
                      <motion.div
                        key={bed._id}
                        whileHover={{ scale: 1.03, y: -2 }}
                        onClick={() => handleBedClick(bed)}
                        className={`relative border-2 rounded-xl p-4 flex flex-col transition-all duration-300 group min-h-[120px] ${STATUS_COLORS[bed.status]}`}
                        title={`${bed.bed_number} — ${bed.status}`}
                      >
                        <div className="flex justify-between items-start w-full mb-3">
                          <div className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${isOccupied ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30' : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'}`}>
                            {bed.bed_number}
                          </div>
                          <BedDouble className={`w-5 h-5 ${
                            isOccupied ? 'text-red-500 dark:text-red-400' :
                            bed.status === 'Available' ? 'text-emerald-500 dark:text-emerald-400' :
                            'text-yellow-500 dark:text-yellow-400'
                          }`} />
                        </div>

                        <div className="flex-1 flex flex-col justify-end">
                          {isOccupied && patient ? (
                            <>
                              <div className="font-bold text-slate-800 dark:text-white text-sm truncate w-full mb-0.5">
                                {patient.name}
                              </div>
                              <div className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 truncate w-full">
                                {patient.diagnosis || 'Pending Diagnosis'}
                              </div>
                            </>
                          ) : (
                            <div className="text-sm font-bold text-slate-400 dark:text-white/40">
                              {t('bedAvailable')}
                            </div>
                          )}
                        </div>
                        
                        <div className={`absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-3 h-3 rounded-full border-2 border-white dark:border-[#081229] ${STATUS_DOT[bed.status]}`} />
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
        
        {beds.length === 0 && (
          <div className="text-center py-12 text-slate-400 dark:text-white/30">
            <BedDouble className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No beds available in the system.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedBed && (
          <PatientModal
            patient={selectedBed.current_patient_id}
            bed={selectedBed}
            onClose={() => setSelectedBed(null)}
            onDischarge={handleDischarge}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
