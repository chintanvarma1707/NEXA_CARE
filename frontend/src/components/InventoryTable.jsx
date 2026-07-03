import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, TrendingDown, TrendingUp, Minus, AlertTriangle, Plus, RefreshCw, CheckCircle2, X } from 'lucide-react';
import { useSmartHealth } from '../context/SmartHealthContext';

const STOCK_COLORS = {
  Good: { badge: 'badge-success', bar: '#14b88a', text: 'text-emerald-400' },
  Medium: { badge: 'badge-info', bar: '#6366f1', text: 'text-blue-400' },
  Low: { badge: 'badge-warning', bar: '#f97316', text: 'text-orange-400' },
  Critical: { badge: 'badge-danger', bar: '#ef4444', text: 'text-red-400' },
};

function RestockModal({ item, onClose, onRestock }) {
  const { t } = useSmartHealth();
  const [qty, setQty] = useState('');
  const [batch, setBatch] = useState('');
  const [expiry, setExpiry] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!qty || parseInt(qty) <= 0) return;
    setLoading(true);
    await onRestock(item._id, { quantity: parseInt(qty), batch_number: batch, expiry_date: expiry || undefined });
    setLoading(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        className="glass-card w-full max-w-sm mx-4 p-6"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="section-title mb-1">Restock Medicine</h3>
        <p className="text-sm text-white/50 mb-5">{item.medicine_name}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Quantity to Add *</label>
            <input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} className="input-glass" placeholder="e.g. 50" required />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Batch Number</label>
            <input type="text" value={batch} onChange={e => setBatch(e.target.value)} className="input-glass" placeholder="BT-2024-001" />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Expiry Date</label>
            <input type="date" value={expiry} onChange={e => setExpiry(e.target.value)} className="input-glass" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-glass flex-1">{t('cancel')}</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {t('restock')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function RequestModal({ item, onClose, onRequest, setToast }) {
  const { t } = useSmartHealth();
  const [qty, setQty] = useState('');
  const [notes, setNotes] = useState('Critical, needed immediately');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!qty || parseInt(qty) <= 0) return;
    setLoading(true);
    try {
      await onRequest(item._id, { quantity_requested: parseInt(qty), notes });
      setToast({ type: 'success', title: 'Request Sent', message: `Indent request for ${qty} ${item.medicine_name} raised successfully.` });
      onClose();
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', title: 'Request Failed', message: err.response?.data?.message || err.message || 'Failed to raise request.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        className="glass-card w-full max-w-sm mx-4 p-6"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="section-title mb-1 text-orange-400">Raise Indent Request</h3>
        <p className="text-sm text-white/50 mb-5">{item.medicine_name}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Quantity Required *</label>
            <input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} className="input-glass" placeholder={`e.g. ${item.minimum_threshold * 2}`} required />
          </div>
          <div>
            <label className="block text-sm text-slate-500 dark:text-white/60 mb-1.5 font-semibold">Urgency / Reason</label>
            <select 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white px-4 py-2.5 rounded-xl outline-none focus:border-primary-500 font-medium"
            >
              <option value="Critical, needed immediately" className="text-slate-800">Critical, needed immediately</option>
              <option value="Urgent, stock running out" className="text-slate-800">Urgent, stock running out</option>
              <option value="Routine Restock" className="text-slate-800">Routine Restock</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-glass flex-1">{t('cancel')}</button>
            <button type="submit" disabled={loading} className="btn-primary bg-orange-500 hover:bg-orange-600 border-orange-500/50 flex-1 flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
              Submit Request
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function InventoryTable({ items = [], onUpdate, onRestock, onRequest, onDelete, readOnly = false }) {
  const { t } = useSmartHealth();
  const [restockItem, setRestockItem] = useState(null);
  const [requestItem, setRequestItem] = useState(null);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const filtered = items.filter(item => {
    const matchSearch = item.medicine_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || item.stock_status === filterStatus;
    return matchSearch && matchStatus;
  });

  const getStockPercent = (item) => {
    if (item.minimum_threshold === 0) return 100;
    const good = item.minimum_threshold * 3;
    return Math.min(100, Math.round((item.current_stock / good) * 100));
  };

  return (
    <div className="relative">
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

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: t('totalMedicines'), value: items.length, color: 'text-white' },
          { label: 'Adequate', value: items.filter(i => i.stock_status === 'Good').length, color: 'text-emerald-400' },
          { label: t('lowStock'), value: items.filter(i => i.stock_status === 'Low' || i.stock_status === 'Medium').length, color: 'text-orange-400' },
          { label: t('criticalStock'), value: items.filter(i => i.stock_status === 'Critical').length, color: 'text-red-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-card-sm p-4 text-center">
            <div className={`text-2xl font-bold ${color} font-display`}>{value}</div>
            <div className="text-xs text-white/50 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={`${t('search')} medicine...`}
          className="input-glass max-w-xs py-2"
        />
        <div className="flex gap-2">
          {['All', 'Good', 'Low', 'Critical'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filterStatus === s ? 'bg-primary-500 text-white' : 'glass-card-sm text-white/50 hover:text-white'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('medicineName')}</th>
                <th>{t('category')}</th>
                <th>{t('currentStock')}</th>
                <th>Stock Level</th>
                <th>{t('minThreshold')}</th>
                <th>{t('expiryDate')}</th>
                <th>{t('stockStatus')}</th>
                {!readOnly && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => {
                const colors = STOCK_COLORS[item.stock_status] || STOCK_COLORS.Good;
                const pct = getStockPercent(item);
                const expiryDate = item.expiry_date ? new Date(item.expiry_date) : null;
                const daysToExpiry = expiryDate ? Math.floor((expiryDate - new Date()) / (1000 * 60 * 60 * 24)) : null;
                const isExpiringSoon = daysToExpiry !== null && daysToExpiry <= 4 && daysToExpiry >= 0;
                const isExpired = daysToExpiry !== null && daysToExpiry < 0;

                return (
                  <motion.tr
                    key={item._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <td>
                      <div className="flex items-center gap-2">
                        <Package className={`w-4 h-4 ${colors.text} flex-shrink-0`} />
                        <div>
                          <div className="font-semibold text-white">{item.medicine_name}</div>
                          {item.batch_number && <div className="text-xs text-white/30 font-mono">{item.batch_number}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge-neutral text-xs">{item.category}</span>
                    </td>
                    <td>
                      <span className={`font-bold ${colors.text}`}>{item.current_stock}</span>
                      <span className="text-white/40 text-xs ml-1">{item.unit}</span>
                    </td>
                    <td className="w-28">
                      <div className="progress-bar w-24">
                        <motion.div
                          className="progress-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          style={{ background: colors.bar }}
                        />
                      </div>
                      <span className="text-xs text-white/40 mt-1 block">{pct}%</span>
                    </td>
                    <td className="text-white/60">{item.minimum_threshold} {item.unit}</td>
                    <td>
                      {expiryDate ? (
                        <span className={(isExpiringSoon || isExpired) ? 'text-orange-400 font-semibold' : 'text-white/50'}>
                          {(isExpiringSoon || isExpired) && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                          {expiryDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                          {isExpiringSoon && <span className="block text-[10px] text-orange-400/80">Expires in {daysToExpiry} days</span>}
                          {isExpired && <span className="block text-[10px] text-red-400">Expired</span>}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      <span className={colors.badge}>{item.stock_status || 'Good'}</span>
                    </td>
                    {!readOnly && (
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setRestockItem(item)}
                            className="p-1.5 text-primary-400 hover:bg-primary-500/20 rounded-lg transition-colors"
                            title={t('restock')}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          {onRequest && (
                            <button
                              onClick={() => setRequestItem(item)}
                              className="p-1.5 text-orange-400 hover:bg-orange-500/20 rounded-lg transition-colors"
                              title="Raise Request"
                            >
                              <AlertTriangle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-white/30">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>{t('noData')}</p>
          </div>
        )}
      </div>

      {/* Restock Modal */}
      {restockItem && (
        <RestockModal
          item={restockItem}
          onClose={() => setRestockItem(null)}
          onRestock={onRestock}
        />
      )}

      {/* Request Modal */}
      <AnimatePresence>
        {requestItem && (
          <RequestModal 
            item={requestItem} 
            onClose={() => setRequestItem(null)} 
            onRequest={onRequest} 
            setToast={(t) => { setToast(t); setTimeout(() => setToast(null), 5000); }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
