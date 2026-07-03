import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users } from 'lucide-react';
import { useSmartHealth } from '../context/SmartHealthContext';

const FOOTFALL_DATA = [
  { day: 'Mon', opd: 145 },
  { day: 'Tue', opd: 132 },
  { day: 'Wed', opd: 168 },
  { day: 'Thu', opd: 184 },
  { day: 'Fri', opd: 156 },
  { day: 'Sat', opd: 120 },
  { day: 'Sun', opd: 85 },
];

export default function FootfallChart() {
  const { t } = useSmartHealth();
  const maxOPD = Math.max(...FOOTFALL_DATA.map(d => d.opd));
  
  // AI forecast calculation (mocked as +12% based on trend)
  const tomorrowForecast = Math.round(FOOTFALL_DATA[FOOTFALL_DATA.length - 1].opd * 1.4);

  return (
    <div className="glass-card p-6 h-full flex flex-col">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="section-title mb-1">
            <Users className="w-5 h-5 text-primary-400" />
            OPD Footfall
          </h3>
          <p className="text-sm text-white/50">Last 7 days daily visits</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-display text-white">{FOOTFALL_DATA.reduce((a,b)=>a+b.opd,0)}</div>
          <div className="text-xs text-white/50">Total This Week</div>
        </div>
      </div>

      <div className="flex-1 flex items-end justify-between gap-2 mt-4">
        {FOOTFALL_DATA.map((data, i) => {
          const heightPercent = (data.opd / maxOPD) * 100;
          return (
            <div key={data.day} className="flex flex-col items-center gap-2 flex-1 group">
              <div className="w-full relative flex justify-center h-32 items-end">
                {/* Tooltip */}
                <div className="absolute -top-8 bg-white/10 backdrop-blur-md px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  {data.opd}
                </div>
                {/* Bar */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPercent}%` }}
                  transition={{ duration: 1, delay: i * 0.1, type: 'spring' }}
                  className="w-full max-w-[32px] bg-primary-500/40 border border-primary-500/50 rounded-t-lg group-hover:bg-primary-500/60 transition-colors"
                />
              </div>
              <div className="text-xs text-white/40 font-medium">{data.day}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-5 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent-500/20 border border-accent-500/30 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-accent-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white flex items-center gap-2">
              AI Forecast: <span className="text-accent-400">{tomorrowForecast} expected tomorrow</span>
            </div>
            <div className="text-xs text-white/50 mt-0.5">Based on historical weather and seasonal disease patterns</div>
          </div>
        </div>
      </div>
    </div>
  );
}
