import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Warehouse, Search, TrendingDown, TrendingUp, AlertTriangle, CheckCircle, Boxes, Calendar, BarChart3 } from 'lucide-react';

const CATEGORY_COLORS = {
  'Antibiotic': { bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-400' },
  'Analgesic': { bg: 'bg-orange-500/10 border-orange-500/20', text: 'text-orange-400', dot: 'bg-orange-400' },
  'Antiviral': { bg: 'bg-purple-500/10 border-purple-500/20', text: 'text-purple-400', dot: 'bg-purple-400' },
  'Antimalarial': { bg: 'bg-cyan-500/10 border-cyan-500/20', text: 'text-cyan-400', dot: 'bg-cyan-400' },
  'Vaccine': { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  'ORS': { bg: 'bg-teal-500/10 border-teal-500/20', text: 'text-teal-400', dot: 'bg-teal-400' },
  'Vitamin': { bg: 'bg-yellow-500/10 border-yellow-500/20', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  'Antifungal': { bg: 'bg-pink-500/10 border-pink-500/20', text: 'text-pink-400', dot: 'bg-pink-400' },
  'Other': { bg: 'bg-slate-500/10 border-slate-500/20', text: 'text-slate-400', dot: 'bg-slate-400' },
};

const STATUS_CONFIG = {
  Good: { badge: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30', bar: '#10b981', icon: TrendingUp },
  Medium: { badge: 'bg-blue-500/15 text-blue-400 border border-blue-500/30', bar: '#6366f1', icon: TrendingUp },
  Low: { badge: 'bg-orange-500/15 text-orange-400 border border-orange-500/30', bar: '#f97316', icon: TrendingDown },
  Critical: { badge: 'bg-red-500/15 text-red-400 border border-red-500/30', bar: '#ef4444', icon: AlertTriangle },
};

function StatCard({ label, value, color, icon: Icon, sub }) {
  return (
    <div className="glass-card-sm p-5 border border-white/5 bg-white/[0.02] dark:bg-white/[0.02] light-theme:bg-white">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/40 dark:text-white/40 light-theme:text-slate-400 mb-2">{label}</p>
          <p className={`text-3xl font-black font-display ${color}`}>{value?.toLocaleString()}</p>
          {sub && <p className="text-xs text-white/30 dark:text-white/30 light-theme:text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color.replace('text-', 'bg-').replace('400', '500/15').replace('emerald-5', 'emerald-4')}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </div>
  );
}

function WarehouseMedicineCard({ item, index }) {
  const status = item.stock_status || 'Good';
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Good;
  const cat = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Other;
  const StatusIcon = cfg.icon;
  const threshold = item.minimum_threshold || 1;
  const pct = Math.min(100, Math.round((item.current_stock / (threshold * 20)) * 100));
  const expiryDate = item.expiry_date ? new Date(item.expiry_date) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="group relative bg-white dark:bg-white/[0.03] light-theme:bg-white border border-slate-100 dark:border-white/5 rounded-2xl p-5 hover:-translate-y-1 hover:shadow-2xl dark:hover:shadow-black/20 transition-all duration-300"
    >
      {/* Left accent line */}
      <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${cfg.bar ? '' : 'bg-emerald-500'}`} style={{ background: cfg.bar }} />

      <div className="pl-3">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${cat.bg} ${cat.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
                {item.category}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${cfg.badge}`}>
                <StatusIcon className="w-2.5 h-2.5 inline mr-1" />
                {status}
              </span>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{item.medicine_name}</h3>
          </div>
        </div>

        {/* Stock Info */}
        <div className="mb-4">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-black font-display text-slate-900 dark:text-white tabular-nums">
              {item.current_stock?.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-slate-400 dark:text-white/40">{item.unit}</span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, delay: index * 0.04 }}
              style={{ background: cfg.bar }}
            />
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-[10px] text-slate-400 dark:text-white/30">Min: {threshold.toLocaleString()} {item.unit}</span>
            <span className="text-[10px] font-semibold text-slate-400 dark:text-white/30">{pct}% Full</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-white/30">
            <Calendar className="w-3 h-3" />
            {expiryDate
              ? `Exp: ${expiryDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`
              : 'No expiry set'}
          </div>
          <div className="text-[11px] font-bold text-slate-500 dark:text-white/40">
            {item.last_restocked
              ? `Restocked ${new Date(item.last_restocked).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
              : '—'}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function AdminWarehouseInventory({ items = [] }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCat, setFilterCat] = useState('All');

  const categories = ['All', ...new Set(items.map(i => i.category).filter(Boolean))];

  const filtered = items.filter(item => {
    const matchSearch = item.medicine_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || item.stock_status === filterStatus;
    const matchCat = filterCat === 'All' || item.category === filterCat;
    return matchSearch && matchStatus && matchCat;
  });

  const totalStock = items.reduce((sum, i) => sum + (i.current_stock || 0), 0);
  const adequate = items.filter(i => i.stock_status === 'Good').length;
  const lowStock = items.filter(i => i.stock_status === 'Low' || i.stock_status === 'Medium').length;
  const critical = items.filter(i => i.stock_status === 'Critical').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
          <Warehouse className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">District Central Warehouse</h2>
          <p className="text-sm text-slate-400 dark:text-white/40 font-medium">Master inventory for the district — stocks are deducted when hospitals are restocked</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Medicines" value={items.length} color="text-violet-400" icon={Boxes} />
        <StatCard label="Total Units in Stock" value={totalStock} color="text-emerald-400" icon={BarChart3} sub={`across ${items.length} medicines`} />
        <StatCard label="Low / Medium" value={lowStock} color="text-orange-400" icon={TrendingDown} />
        <StatCard label="Critical Stock" value={critical} color="text-red-400" icon={AlertTriangle} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/30" />
          <input
            type="text"
            placeholder="Search medicine..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-800 dark:text-white text-sm outline-none focus:border-violet-400 dark:focus:border-violet-400 transition-colors"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {['All', 'Good', 'Low', 'Critical'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                filterStatus === s
                  ? 'bg-violet-500 text-white border-violet-400 shadow-md shadow-violet-500/20'
                  : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/50 bg-white dark:bg-transparent hover:border-violet-400 hover:text-violet-500 dark:hover:text-violet-400'
              }`}>{s}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.slice(0, 5).map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                filterCat === c
                  ? 'bg-slate-700 dark:bg-white/20 text-white border-transparent'
                  : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/50 bg-white dark:bg-transparent hover:border-slate-400 dark:hover:border-white/20'
              }`}>{c}</button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs font-semibold text-slate-400 dark:text-white/30">
        Showing {filtered.length} of {items.length} medicines
      </p>

      {/* Grid of cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-white/[0.02] rounded-2xl border border-slate-100 dark:border-white/5">
          <Package className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-white/20" />
          <p className="text-slate-400 dark:text-white/30 font-semibold">No medicines match your filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((item, i) => (
            <WarehouseMedicineCard key={item._id} item={item} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
