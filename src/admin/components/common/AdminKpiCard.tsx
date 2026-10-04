import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface AdminKpiCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  timeframe: string;
  icon: React.ReactNode;
  accent?: 'rose' | 'amber' | 'emerald' | 'blue' | 'purple';
}

export const AdminKpiCard: React.FC<AdminKpiCardProps> = ({
  title,
  value,
  change,
  isPositive,
  timeframe,
  icon,
  accent = 'rose'
}) => {
  const accentGlow = {
    rose: 'hover:border-rose-500/40 group-hover:bg-rose-500/10 text-rose-400',
    amber: 'hover:border-amber-500/40 group-hover:bg-amber-500/10 text-amber-400',
    emerald: 'hover:border-emerald-500/40 group-hover:bg-emerald-500/10 text-emerald-400',
    blue: 'hover:border-blue-500/40 group-hover:bg-blue-500/10 text-blue-400',
    purple: 'hover:border-purple-500/40 group-hover:bg-purple-500/10 text-purple-400'
  }[accent];

  return (
    <div className={`group relative bg-[#0e1219]/90 border border-white/5 rounded-2xl p-5 transition-all duration-300 hover:shadow-xl hover:shadow-black/50 hover:-translate-y-0.5 ${accentGlow}`}>
      {/* Background ambient gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent rounded-2xl pointer-events-none" />

      <div className="relative flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl bg-white/[0.03] border border-white/5 transition-colors ${accentGlow}`}>
          {icon}
        </div>
      </div>

      <div className="relative mt-4">
        <div className="text-2xl lg:text-3xl font-bold tracking-tight text-white font-['Cinzel',serif]">
          {value}
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-xs">
          <span
            className={`inline-flex items-center font-medium ${
              isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
            )}
            {change}
          </span>
          <span className="text-zinc-500">{timeframe}</span>
        </div>
      </div>
    </div>
  );
};
