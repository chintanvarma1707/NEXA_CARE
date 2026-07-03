import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Brain, AlertTriangle } from 'lucide-react';

const URGENCY_COLORS = {
  Critical: 'border-red-500/50 bg-red-500/8 text-red-400',
  High: 'border-orange-500/50 bg-orange-500/8 text-orange-400',
  Medium: 'border-yellow-500/50 bg-yellow-500/8 text-yellow-400',
  Low: 'border-blue-500/30 bg-blue-500/5 text-blue-400',
  None: 'border-white/10 bg-white/5 text-white/50',
};

const TREND_ICON = {
  Increasing: TrendingUp,
  Decreasing: TrendingDown,
  Stable: Minus,
};

const TREND_COLOR = {
  Increasing: 'text-red-400',
  Decreasing: 'text-primary-400',
  Stable: 'text-white/50',
};

export default function StockForecastPanel({ predictions = [], isLoading = false }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="glass-card-sm p-4 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-1/3 mb-2" />
            <div className="h-3 bg-white/5 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (!predictions || predictions.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <Brain className="w-10 h-10 mx-auto mb-3 text-accent-500 opacity-60" />
        <p className="text-white/60 font-semibold">No forecast data available</p>
        <p className="text-sm text-white/30 mt-1">Add usage history to generate AI predictions</p>
      </div>
    );
  }

  const urgent = predictions.filter(p => ['Critical', 'High', 'Medium'].includes(p.urgency));
  const safe = predictions.filter(p => !['Critical', 'High', 'Medium'].includes(p.urgency));

  return (
    <div className="space-y-4">
      {/* AI Badge */}
      <div className="flex items-center gap-2 px-3 py-2 glass-card-sm border border-accent-500/30 bg-accent-500/5 w-fit">
        <Brain className="w-4 h-4 text-accent-500" />
        <span className="text-xs text-accent-500 font-semibold">AI Predictions — 30-day usage analysis</span>
      </div>

      {/* Urgent items */}
      {urgent.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            Requires Attention ({urgent.length})
          </h5>
          {urgent.map((pred, i) => {
            const TrendIcon = TREND_ICON[pred.trend] || Minus;
            const colorClass = URGENCY_COLORS[pred.urgency] || URGENCY_COLORS.None;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`glass-card-sm border p-4 ${colorClass.split(' ').slice(0, 2).join(' ')}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-white">{pred.medicine_name}</p>
                    {pred.message && <p className="text-sm mt-1 opacity-80">{pred.message}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {pred.days_to_stockout !== null && pred.days_to_stockout !== undefined && (
                      <div className="glass-card-sm px-3 py-1.5 text-center">
                        <div className="text-xl font-bold text-white">{pred.days_to_stockout}</div>
                        <div className="text-xs text-white/40">days left</div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10">
                  <div className="flex items-center gap-1.5">
                    <TrendIcon className={`w-3.5 h-3.5 ${TREND_COLOR[pred.trend]}`} />
                    <span className="text-xs text-white/50">Usage {pred.trend}</span>
                  </div>
                  <div className="text-xs text-white/50">
                    Avg: <span className="text-white/70 font-medium">{pred.avg_daily_usage}/day</span>
                  </div>
                  {pred.predicted_stockout_date && (
                    <div className="text-xs text-white/50">
                      Est. out: <span className="text-white/70 font-medium">{pred.predicted_stockout_date}</span>
                    </div>
                  )}
                  <span className="ml-auto text-xs font-semibold text-white/60 bg-white/10 px-2 py-0.5 rounded">
                    Stock: {pred.current_stock}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Safe items (compact) */}
      {safe.length > 0 && (
        <div>
          <h5 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2">
            ✓ Adequate Stock ({safe.length} items)
          </h5>
          <div className="grid grid-cols-2 gap-2">
            {safe.map((pred, i) => (
              <div key={i} className="glass-card-sm p-3 border border-white/10">
                <p className="text-sm text-white/70 font-medium truncate">{pred.medicine_name}</p>
                <p className="text-xs text-emerald-400 mt-1">
                  {pred.days_to_stockout ? `~${pred.days_to_stockout} days remaining` : 'Adequate'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
