import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Shield, Zap, Users, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useSmartHealth } from '../context/SmartHealthContext';

const DEMO_CREDS = [
  { label: 'District Admin', email: 'admin@nexacare.gov.in', password: 'Admin@123', role: 'admin' },
  { label: 'PHC Manager (Hospital)', email: 'phc1@nexacare.gov.in', password: 'PHC@123', role: 'phc' },
  { label: 'Receptionist', email: 'reception@nexacare.gov.in', password: 'Rec@123', role: 'phc' },
  { label: 'Inventory Manager', email: 'inventory@nexacare.gov.in', password: 'Inv@123', role: 'phc' },
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
      {/* Left Panel — Branding */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden"
      >
        {/* Background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #14b88a 0%, transparent 70%)' }} />
          <div className="absolute bottom-32 right-16 w-56 h-56 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }} />
          <div className="absolute top-1/2 left-1/2 w-96 h-96 rounded-full opacity-10 -translate-x-1/2 -translate-y-1/2"
            style={{ background: 'radial-gradient(circle, #14b88a 0%, transparent 60%)' }} />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary-500/20 border border-primary-500/40 flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary-400" />
            </div>
            <span className="text-2xl font-bold font-display text-white">Nexa Care</span>
          </div>
          <p className="text-primary-400 text-sm font-medium ml-13 pl-[52px]">SmartHealth Ecosystem</p>
        </div>

        {/* Main copy */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-5xl font-bold font-display text-white leading-tight mb-4">
              Transforming
              <span className="block text-gradient">Rural Healthcare</span>
              with AI
            </h1>
            <p className="text-white/60 text-lg leading-relaxed">
              Real-time inventory management, AI-driven forecasting, and smart redistribution for Primary Health Centres across Maharashtra.
            </p>
          </div>

          {/* Feature pills */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Zap, text: 'AI Demand Forecasting', color: 'text-yellow-400' },
              { icon: Activity, text: 'Real-Time Bed Tracking', color: 'text-primary-400' },
              { icon: Shield, text: 'Smart Redistribution', color: 'text-blue-400' },
              { icon: Users, text: '3 Language Support', color: 'text-purple-400' }
            ].map(({ icon: Icon, text, color }) => (
              <div key={text} className="glass-card-sm p-3 flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
                <span className="text-sm text-white/70 font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-white/40 text-sm">
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
            <Activity className="w-7 h-7 text-primary-400" />
            <span className="text-xl font-bold text-white font-display">Nexa Care</span>
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
                    className="w-full flex items-center justify-between glass-card-sm px-4 py-2.5 hover:bg-white/[0.08] transition-colors group"
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
