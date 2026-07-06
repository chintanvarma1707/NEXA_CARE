import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Shield, Zap, Users, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useSmartHealth } from '../context/SmartHealthContext';

const DEMO_CREDS = [
  { label: 'District Admin', email: 'admin@nexacare.gov.in', password: 'Admin@123', role: 'admin' },
  { label: 'PHC Manager (Hospital)', email: 'phc1@nexacare.gov.in', password: 'PHC@123', role: 'phc' },
  { label: 'CHC Manager (Hospital)', email: 'chc@nexacare.gov.in', password: 'CHC@123', role: 'chc' },
];

export default function LoginPage() {
  const { login, loading, t } = useSmartHealth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(email, password);
    if (!result.success) setError(result.error);
  };

  const fillDemo = async (cred) => {
    setEmail(cred.email);
    setPassword(cred.password);
    setError('');
    const result = await login(cred.email, cred.password);
    if (!result.success) setError(result.error);
  };

  return (
    <div className="min-h-screen flex bg-app">
      {/* Left Panel — Branding with Premium Mesh Gradient Background */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden lg:flex flex-col justify-between w-[55%] p-16 relative overflow-hidden bg-[#050b14]"
      >
        {/* Animated Mesh Gradient Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
              x: [0, 50, 0],
              y: [0, -50, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full mix-blend-screen filter blur-[100px]"
            style={{ background: 'radial-gradient(circle, rgba(20,184,138,0.8) 0%, transparent 70%)' }} 
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.5, 1],
              rotate: [0, -90, 0],
              x: [0, -50, 0],
              y: [0, 50, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[0%] right-[0%] w-[60%] h-[60%] rounded-full mix-blend-screen filter blur-[100px]"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.6) 0%, transparent 70%)' }} 
          />
          <div className="absolute top-1/2 left-1/2 w-full h-full rounded-full opacity-30 -translate-x-1/2 -translate-y-1/2 filter blur-[120px]"
            style={{ background: 'radial-gradient(circle, rgba(20,184,138,0.4) 0%, transparent 60%)' }} />
        </div>

        {/* Abstract pattern overlay */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-white border border-primary-400/50 flex items-center justify-center shadow-[0_0_30px_rgba(20,184,138,0.3)] backdrop-blur-md overflow-hidden">
              <img src="/logo.jpg" alt="Nexa Care Logo" className="w-full h-full object-contain scale-[1.6]" />
            </div>
            <span className="text-3xl font-extrabold font-display text-slate-50 tracking-tight">Nexa Care</span>
          </div>
          <p className="text-primary-300 text-sm font-semibold tracking-widest uppercase ml-16">SmartHealth Ecosystem</p>
        </div>

        {/* Main copy */}
        <div className="relative z-10 space-y-10 my-auto">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-6xl font-black font-display text-slate-50 leading-[1.1] mb-6"
            >
              {t('transformingRural')}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-emerald-300 to-teal-200 drop-shadow-sm pb-2">
                {t('ruralHealthcare')}
              </span>
              {t('withAi')}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-slate-300 text-xl leading-relaxed max-w-xl font-light"
            >
              {t('realTimeDesc')}
            </motion.p>
          </div>

          {/* Feature pills */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-2 gap-4 max-w-xl"
          >
            {[
              { icon: Zap, text: 'AI Demand Forecasting', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
              { icon: Activity, text: 'Real-Time Bed Tracking', color: 'text-primary-400', bg: 'bg-primary-400/10', border: 'border-primary-400/20' },
              { icon: Shield, text: 'Smart Redistribution', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
              { icon: Users, text: 'Logistics & Referrals', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' }
            ].map(({ icon: Icon, text, color, bg, border }) => (
              <div key={text} className={`p-4 rounded-2xl flex items-center gap-3 backdrop-blur-md border ${border} ${bg} transition-transform hover:-translate-y-1 duration-300`}>
                <Icon className={`w-5 h-5 ${color} flex-shrink-0`} />
                <span className="text-sm text-slate-50 font-medium tracking-wide">{text}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Footer */}
        <div className="relative z-10 mt-auto pt-8 border-t border-[rgba(255,255,255,0.1)]">
          <div className="flex items-center gap-3 text-slate-400 text-sm font-medium">
            <span className="pulse-dot" />
            <span>Government of Maharashtra — Health & Family Welfare Dept.</span>
          </div>
        </div>
      </motion.div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-white border border-primary-400/30 flex items-center justify-center overflow-hidden">
              <img src="/logo.jpg" alt="Nexa Care" className="w-full h-full object-contain scale-[1.6]" />
            </div>
            <span className="text-2xl font-extrabold text-white font-display">Nexa Care</span>
          </div>

          <div className="glass-card p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold font-display text-white mb-2">{t('loginTitle')}</h2>
              <p className="text-white/50 text-sm">{t('loginSubtitle')}</p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-5"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1.5">{t('email')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@nexacare.gov.in"
                  className="input-glass"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-1.5">{t('password')}</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-glass pr-12"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-2 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  t('login')
                )}
              </button>
            </form>

            {/* Demo credentials */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-xs text-white/40 text-center mb-3 font-medium uppercase tracking-wider">Demo Access</p>
              <div className="space-y-2">
                {DEMO_CREDS.map(cred => (
                  <button
                    key={cred.email}
                    onClick={() => fillDemo(cred)}
                    className="w-full flex items-center justify-between glass-card-sm px-4 py-2.5 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full ${cred.role === 'admin' ? 'bg-accent-500' : 'bg-primary-400'}`} />
                      <span className="text-sm text-white/70 group-hover:text-white transition-colors">{cred.label}</span>
                    </div>
                    <span className="text-xs text-white/30 group-hover:text-white/50 font-mono">{cred.email}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
