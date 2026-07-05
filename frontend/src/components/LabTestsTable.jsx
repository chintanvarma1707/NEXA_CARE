import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Beaker, CheckCircle2, Clock, Thermometer, FlaskConical, Dna, Microscope, Zap, AlertTriangle, FileBarChart, Crosshair } from 'lucide-react';

const DEPARTMENTS = [
  {
    id: 'PATH-01', name: 'Pathology Center', type: 'Clinical', status: 'Processing', load: 75,
    icon: Microscope, color: 'from-blue-500/20 to-indigo-500/20', border: 'border-blue-500/30', text: 'text-blue-400',
    desc: '12 samples running', doctor: 'Dr. S. Iyer'
  },
  {
    id: 'RAD-02', name: 'Radiology & X-Ray', type: 'Imaging', status: 'Scanning', load: 45,
    icon: Activity, color: 'from-purple-500/20 to-fuchsia-500/20', border: 'border-purple-500/30', text: 'text-purple-400',
    desc: 'Chest X-ray in progress', doctor: 'Dr. K. Pillai'
  },
  {
    id: 'BLD-03', name: 'Blood Bank', type: 'Storage', status: 'Optimal', load: 85,
    icon: Thermometer, color: 'from-red-500/20 to-rose-500/20', border: 'border-red-500/30', text: 'text-red-400',
    desc: '14 units of O-ve available', doctor: 'Automated'
  },
  {
    id: 'MIC-04', name: 'Microbiology', type: 'Incubation', status: 'Active', load: 60,
    icon: Dna, color: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400',
    desc: 'Culture incubation active', doctor: 'Dr. R. Desai'
  },
  {
    id: 'CHM-05', name: 'Biochemistry', type: 'Analysis', status: 'Standby', load: 10,
    icon: FlaskConical, color: 'from-amber-500/20 to-orange-500/20', border: 'border-amber-500/30', text: 'text-amber-400',
    desc: 'Analyzer awaiting samples', doctor: 'Dr. M. Khan'
  }
];

const INITIAL_QUEUE = [
  {
    id: 'SMPL-9942', name: 'Om Prakash', age: 71, time: '08:15 AM',
    priority: 'STAT', tests: ['Troponin I', 'ABG'], status: 'in-progress',
    progress: 65, dept: 'Biochemistry'
  },
  {
    id: 'SMPL-9943', name: 'Baby Priya', age: 2, time: '09:00 AM',
    priority: 'URGENT', tests: ['CBC', 'CRP'], status: 'in-progress',
    progress: 30, dept: 'Pathology Center'
  },
  {
    id: 'SMPL-9944', name: 'Kavita Sharma', age: 28, time: '10:00 AM',
    priority: 'ROUTINE', tests: ['Lipid Profile', 'HbA1c'], status: 'pending',
    progress: 0, dept: 'Pathology Center'
  }
];

export default function LabTestsTable() {
  const [queue, setQueue] = useState(INITIAL_QUEUE);
  const [activeDept, setActiveDept] = useState('All');
  const [analyzingId, setAnalyzingId] = useState(null);

  // Simulate progress updates
  useEffect(() => {
    const interval = setInterval(() => {
      setQueue(prev => prev.map(q => {
        if (q.status === 'in-progress' && q.progress < 100 && q.id !== analyzingId) {
          const newProg = q.progress + Math.floor(Math.random() * 5);
          if (newProg >= 100) {
            return { ...q, progress: 100, status: 'completed', result: 'Auto-verified: Normal range' };
          }
          return { ...q, progress: newProg };
        }
        return q;
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, [analyzingId]);

  const handleAnalyze = (id) => {
    setAnalyzingId(id);
    setQueue(prev => prev.map(q => q.id === id ? { ...q, status: 'in-progress' } : q));
    
    // Fast forward completion
    let simProgress = 0;
    const sim = setInterval(() => {
      simProgress += 20;
      setQueue(prev => prev.map(q => q.id === id ? { ...q, progress: Math.min(simProgress, 100) } : q));
      if (simProgress >= 100) {
        clearInterval(sim);
        setQueue(prev => prev.map(q => q.id === id ? { ...q, status: 'completed', result: 'Analysis Complete: Ready for Review' } : q));
        setAnalyzingId(null);
      }
    }, 500);
  };

  const filteredQueue = activeDept === 'All' ? queue : queue.filter(q => q.dept === activeDept);

  return (
    <div className="flex flex-col space-y-6 h-full text-slate-800 dark:text-white pb-10">
      
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-500/20 rounded-xl"><Beaker className="w-6 h-6 text-primary-400" /></div>
            <div>
              <div className="text-2xl font-bold font-display">124</div>
              <div className="text-sm font-medium opacity-60">Samples Today</div>
            </div>
          </div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-xl"><Clock className="w-6 h-6 text-blue-400" /></div>
            <div>
              <div className="text-2xl font-bold font-display">42 min</div>
              <div className="text-sm font-medium opacity-60">Avg Turnaround</div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5 relative overflow-hidden group border-red-500/30">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-red-500" />
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/20 rounded-xl"><Zap className="w-6 h-6 text-red-400" /></div>
            <div>
              <div className="text-2xl font-bold font-display text-red-400">1 STAT</div>
              <div className="text-sm font-medium opacity-60">Critical Priority</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Departments Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">
              <Crosshair className="w-5 h-5 text-primary-400" />
              Department Clusters
            </h2>
            <div className="flex gap-2">
              <button onClick={() => setActiveDept('All')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${activeDept === 'All' ? 'bg-primary-500 text-white' : 'glass-card-sm text-slate-500 hover:text-slate-700 dark:text-white/60 dark:hover:text-white'}`}>ALL</button>
              {DEPARTMENTS.map(d => (
                <button key={d.id} onClick={() => setActiveDept(d.name)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${activeDept === d.name ? 'bg-primary-500 text-white' : 'glass-card-sm text-slate-500 hover:text-slate-700 dark:text-white/60 dark:hover:text-white'}`}>
                  {d.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DEPARTMENTS.map((dept, idx) => (
              <motion.div 
                key={dept.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setActiveDept(dept.name)}
                className={`glass-card p-5 relative overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 ${activeDept === dept.name ? 'ring-2 ring-primary-500 shadow-[0_0_20px_rgba(20,184,138,0.2)]' : ''}`}
              >
                {/* Background Gradient & Pattern */}
                <div className={`absolute inset-0 bg-gradient-to-br ${dept.color} opacity-20`} />
                <div className="absolute -right-4 -top-4 opacity-5 mix-blend-overlay">
                  <dept.icon className="w-32 h-32" />
                </div>

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-2.5 rounded-xl bg-white/10 dark:bg-black/20 backdrop-blur-md border ${dept.border} ${dept.text}`}>
                      <dept.icon className="w-5 h-5" />
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-mono tracking-widest opacity-50 mb-1">{dept.id}</div>
                      <div className={`text-xs font-bold uppercase tracking-wider ${dept.status === 'Processing' || dept.status === 'Scanning' ? 'text-emerald-500 animate-pulse' : dept.status === 'Active' ? 'text-blue-500' : 'text-slate-400'}`}>
                        {dept.status}
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold font-display leading-tight mb-1">{dept.name}</h3>
                  <p className="text-sm font-medium opacity-60 mb-4 h-5">{dept.desc}</p>
                  
                  {/* Capacity Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="opacity-50">Operational Load</span>
                      <span className={dept.text}>{dept.load}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden flex">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${dept.load}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full rounded-full ${dept.load > 80 ? 'bg-red-500' : dept.load > 50 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Col: Live Queue */}
        <div className="glass-card p-0 flex flex-col h-[600px] overflow-hidden border-primary-500/20 shadow-[0_0_30px_rgba(20,184,138,0.05)]">
          <div className="p-5 border-b border-white/10 bg-gradient-to-r from-transparent to-primary-500/5">
            <h2 className="section-title text-lg mb-1">
              <Activity className="w-5 h-5 text-primary-400" />
              Live Test Queue
            </h2>
            <p className="text-xs font-medium opacity-50">Real-time LIS Sync active</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            <AnimatePresence>
              {filteredQueue.map((q) => {
                const isStat = q.priority === 'STAT';
                const isCompleted = q.status === 'completed';
                const isAnalyzing = q.id === analyzingId;

                return (
                  <motion.div 
                    key={q.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    layout
                    className={`p-4 rounded-xl border relative overflow-hidden ${
                      isCompleted ? 'bg-emerald-500/5 border-emerald-500/20' 
                      : isStat ? 'bg-red-500/5 border-red-500/30' 
                      : 'glass-card-sm'
                    }`}
                  >
                    {/* Progress Bar Background */}
                    {!isCompleted && q.progress > 0 && (
                      <div 
                        className="absolute inset-y-0 left-0 bg-primary-500/10 transition-all duration-500 ease-out z-0" 
                        style={{ width: `${q.progress}%` }} 
                      />
                    )}

                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] tracking-widest opacity-40">||||| {q.id}</span>
                          <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md ${
                            isStat ? 'bg-red-500 text-white animate-pulse' 
                            : q.priority === 'URGENT' ? 'bg-orange-500 text-white' 
                            : 'bg-slate-200 text-slate-700 dark:bg-white/20 dark:text-white'
                          }`}>
                            {q.priority}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold opacity-40 flex items-center gap-1"><Clock className="w-3 h-3" /> {q.time}</span>
                      </div>
                      
                      <h4 className="font-bold text-[15px] mb-0.5">{q.name} <span className="text-xs font-normal opacity-50">({q.age}y)</span></h4>
                      <p className="text-xs font-semibold opacity-60 text-primary-600 dark:text-primary-400 mb-3">{q.dept}</p>
                      
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {q.tests.map(t => (
                          <span key={t} className="px-2 py-1 bg-slate-200/50 text-slate-700 dark:bg-black/20 dark:text-white/80 text-[10px] font-bold rounded">
                            {t}
                          </span>
                        ))}
                      </div>

                      {isCompleted ? (
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 p-2 rounded-lg">
                          <CheckCircle2 className="w-4 h-4" /> {q.result}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex-1 mr-4">
                            <div className="flex justify-between text-[10px] font-bold mb-1 opacity-50">
                              <span>{isAnalyzing ? 'Analyzing...' : 'In Queue'}</span>
                              <span>{q.progress}%</span>
                            </div>
                            <div className="w-full h-1 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-primary-500 transition-all duration-300" style={{ width: `${q.progress}%` }} />
                            </div>
                          </div>
                          {q.progress === 0 && !isAnalyzing && (
                            <button onClick={() => handleAnalyze(q.id)} className="shrink-0 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1 transition-all">
                              <Activity className="w-3 h-3" /> Run
                            </button>
                          )}
                          {isAnalyzing && (
                            <div className="shrink-0 px-3 py-1.5 bg-primary-500/20 text-primary-500 text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5">
                              <div className="w-3 h-3 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                              Running
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {filteredQueue.length === 0 && (
              <div className="text-center py-10 opacity-30">
                <FileBarChart className="w-10 h-10 mx-auto mb-2" />
                <p className="text-sm font-bold">No active tests in this department</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
