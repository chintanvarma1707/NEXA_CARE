import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Beaker, CheckCircle2, Clock, Thermometer, X } from 'lucide-react';

const TABS = [
  { id: 'b1', title: 'B1 — Laboratory', free: 2, busy: 3 },
  { id: 'g', title: 'G — OPD & Emergency', free: 1, busy: 5 },
  { id: '1f', title: '1F — General Wards', free: 1, busy: 5 },
  { id: '2f', title: '2F — ICU & Special', free: 0, busy: 4 },
  { id: '3f', title: '3F — OT & Recovery', free: 2, busy: 3 },
];

const ROOMS = [
  {
    id: 'B1', name: 'Pathology Lab', type: 'Laboratory', status: 'Occupied',
    desc: 'Processing 12 samples', doctor: 'Dr. S. Iyer (Lab)'
  },
  {
    id: 'B2', name: 'Radiology / X-Ray', type: 'Imaging', status: 'Occupied',
    desc: 'Chest X-ray in progress', doctor: 'Dr. K. Pillai (Rad)'
  },
  {
    id: 'B3', name: 'Blood Bank', type: 'Lab', status: 'Available',
    desc: 'Idle — 14 units in stock', doctor: ''
  },
  {
    id: 'B4', name: 'Microbiology Lab', type: 'Laboratory', status: 'Occupied',
    desc: 'Culture incubation active', doctor: ''
  },
  {
    id: 'B5', name: 'Sample Collection', type: 'Collection', status: 'Available',
    desc: '4 samples collected today', doctor: ''
  },
  {
    id: 'B6', name: 'Cold Storage', type: 'Storage', status: 'Maintenance',
    desc: 'Compressor repair underway', doctor: ''
  }
];

const MOCK_QUEUE = [
  {
    id: 'PHC-2026-0061', name: 'Om Prakash', age: 71, doctor: 'Dr. Vikram Singh', time: '08:15',
    priority: 'STAT', tests: ['Troponin I', 'D-Dimer', 'PT/INR', 'ABG'], status: 'in-progress'
  },
  {
    id: 'PHC-2026-0051', name: 'Baby Priya', age: 2, doctor: 'Dr. Sunita Rao', time: '09:00',
    priority: 'URGENT', tests: ['CBC', 'CRP', 'Blood Culture', 'Malaria'], status: 'in-progress'
  },
  {
    id: 'PHC-2026-0071', name: 'Kavita Sharma', age: 28, doctor: 'Dr. Ananya Das', time: '10:00',
    priority: 'URGENT', tests: ['CTG', 'Biophysical Profile', 'Hb'], status: 'in-progress'
  },
  {
    id: 'PHC-2026-0041', name: 'Ramesh Kumar', age: 54, doctor: 'Dr. Priya Menon', time: '07:30',
    priority: 'ROUTINE', tests: ['CBC', 'Lipid Profile', 'HbA1c', 'FBS'], status: 'completed',
    result: 'LDL 148 mg/dL (High) · HbA1c 7.8% · FBS 142 mg/dL'
  },
  {
    id: 'PHC-2026-0031', name: 'Meena Joshi', age: 45, doctor: 'Dr. Rahul Verma', time: '09:45',
    priority: 'ROUTINE', tests: ['Urine R/M', 'Blood Group & RH', 'USG'], status: 'completed',
    result: 'Blood Group O+ve · Urine normal · USG — appendix visualised'
  }
];

export default function LabTestsTable() {
  const [activeTab, setActiveTab] = useState('b1');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [queue, setQueue] = useState(MOCK_QUEUE);

  const handleComplete = (id) => {
    setQueue(prev => prev.map(q => q.id === id ? { ...q, status: 'completed', result: 'Results automatically synced via LIS.' } : q));
  };

  return (
    <div className="flex flex-col space-y-6 h-full text-slate-800 dark:text-white">
      {/* Tabs */}
      <div className="flex overflow-x-auto scrollbar-hide gap-3 pb-2 border-b border-white/10 dark:border-white/10 border-slate-200">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 flex flex-col items-start px-4 py-2.5 rounded-xl border transition-all ${
                isActive 
                  ? 'bg-primary-600/10 border-primary-500 shadow-[0_0_15px_rgba(20,184,138,0.15)] dark:bg-primary-500/20'
                  : 'glass-card-sm hover:border-primary-500/50'
              }`}
            >
              <div className="flex items-center gap-2">
                {isActive && <Beaker className="w-4 h-4 text-primary-500" />}
                <span className={`text-sm font-bold ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-600 dark:text-white/70'}`}>
                  {tab.title}
                </span>
              </div>
              <div className="text-[11px] font-medium mt-0.5 text-slate-500 dark:text-white/40">
                {tab.free} free • {tab.busy} busy
              </div>
            </button>
          );
        })}
      </div>

      <div className="mb-2">
        <h2 className="text-xl font-bold font-display text-slate-800 dark:text-white">B1 — Laboratory</h2>
        <p className="text-sm text-slate-500 dark:text-white/50">Diagnostic & Pathology</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
        {ROOMS.map(room => {
          const isOccupied = room.status === 'Occupied';
          const isAvail = room.status === 'Available';
          
          let cardStyle = "glass-card p-5 cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-1 ";
          if (isOccupied) cardStyle += "bg-orange-50 border-orange-200 shadow-[0_4px_20px_rgba(251,146,60,0.1)] dark:bg-orange-500/10 dark:border-orange-500/30";
          else if (isAvail) cardStyle += "hover:border-primary-400/50";

          let dotColor = isOccupied ? "bg-orange-400" : isAvail ? "bg-emerald-400" : "bg-slate-400";
          let badgeColor = isOccupied ? "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400" 
                           : isAvail ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" 
                           : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300";

          return (
            <motion.div 
              key={room.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedRoom(room)}
              className={cardStyle}
            >
              <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${dotColor}`} />
              <div className="text-[11px] font-bold text-slate-400 dark:text-white/40 mb-1">{room.id}</div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white leading-tight">{room.name}</h3>
              <div className="text-xs text-slate-500 dark:text-white/50 mb-3">{room.type}</div>
              
              <div className="text-sm font-medium text-slate-600 dark:text-white/70">{room.desc}</div>
              {room.doctor && <div className="text-xs text-orange-600 dark:text-orange-400 font-semibold mt-1">{room.doctor}</div>}
              
              <div className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold mt-4 ${badgeColor}`}>
                {room.status}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-900/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-white dark:bg-[#0c1a3f] border border-orange-200 dark:border-orange-500/30 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-5 flex justify-between items-start border-b border-orange-100 dark:border-white/10 bg-orange-50/50 dark:bg-white/5 relative">
                <div>
                  <h2 className="text-2xl font-bold font-display text-slate-800 dark:text-white">{selectedRoom.name}</h2>
                  <p className="text-sm text-slate-500 dark:text-white/50">{selectedRoom.type} · Room {selectedRoom.id}</p>
                </div>
                <button onClick={() => setSelectedRoom(null)} className="p-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-slate-600 dark:text-white/70" />
                </button>
              </div>

              <div className="p-5 flex gap-4 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-transparent">
                <div className="bg-slate-200/50 dark:bg-white/5 px-4 py-2.5 rounded-xl">
                  <div className="text-[11px] text-slate-500 dark:text-white/40 uppercase tracking-wider font-semibold mb-1">Status</div>
                  <div className="text-sm font-bold text-orange-600 dark:text-orange-400">{selectedRoom.status}</div>
                </div>
                {selectedRoom.doctor && (
                  <div className="bg-slate-200/50 dark:bg-white/5 px-4 py-2.5 rounded-xl">
                    <div className="text-[11px] text-slate-500 dark:text-white/40 uppercase tracking-wider font-semibold mb-1">Assigned</div>
                    <div className="text-sm font-bold text-slate-700 dark:text-white/80">{selectedRoom.doctor}</div>
                  </div>
                )}
                <div className="flex-1 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-4 py-2.5 rounded-xl flex items-center gap-3">
                  <Activity className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{selectedRoom.desc}</span>
                </div>
              </div>

              {/* Queue List */}
              <div className="flex-1 overflow-y-auto p-5 bg-white dark:bg-transparent">
                <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-white/10">
                  <Beaker className="w-4 h-4 text-primary-500" /> Lab Test Queue
                  <span className="ml-auto flex gap-3 text-[11px] font-semibold text-slate-500 dark:text-white/50">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> Stat</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400" /> Urgent</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400" /> Routine</span>
                  </span>
                </h4>

                <div className="space-y-4">
                  {queue.map(q => {
                    const isStat = q.priority === 'STAT';
                    const isUrgent = q.priority === 'URGENT';
                    const isCompleted = q.status === 'completed';
                    
                    let badgeClass = "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/40";
                    if (isStat) badgeClass = "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400";
                    else if (isUrgent) badgeClass = "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400";

                    return (
                      <div key={q.id} className="border-b border-slate-100 dark:border-white/5 pb-4 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[11px] font-mono text-slate-400 dark:text-white/40">{q.id}</span>
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${badgeClass}`}>
                                {q.priority}
                              </span>
                            </div>
                            <div className="font-bold text-slate-800 dark:text-white">
                              {q.name} <span className="text-slate-400 dark:text-white/40 text-sm font-normal">({q.age}y)</span>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-white/50">{q.doctor} · {q.time}</div>
                          </div>
                          <div className="text-right">
                            {isCompleted ? (
                              <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-4 h-4" /> completed
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-xs font-bold text-orange-500 dark:text-orange-400">
                                <Clock className="w-4 h-4" /> in progress
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3 mt-3">
                          {q.tests.map(test => (
                            <span key={test} className="px-2.5 py-1 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70 text-xs font-semibold rounded-md">
                              {test}
                            </span>
                          ))}
                        </div>

                        {!isCompleted ? (
                          <button onClick={() => handleComplete(q.id)} className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm">
                            Mark Completed
                          </button>
                        ) : (
                          <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 text-xs font-medium p-3 rounded-lg flex items-start gap-2 border border-emerald-100 dark:border-emerald-500/20">
                            <CheckCircle2 className="w-4 h-4 mt-0.5 opacity-70" />
                            <span className="leading-relaxed"><strong>Result:</strong> {q.result}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
