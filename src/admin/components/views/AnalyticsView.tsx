import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, Film, DollarSign, Smartphone, Monitor, Globe } from 'lucide-react';
import { AdminChart } from '../common/AdminChart';

export const AnalyticsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'users' | 'content'>('overview');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white font-['Cinzel',serif]">
          Analytics & Performance Insights
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Deep-dive telemetry into streaming minutes, subscriber growth, and churn metrics.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-[#0e1219] border border-white/5 rounded-2xl">
        {(['overview', 'revenue', 'users', 'content'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
              activeTab === tab
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab} Analytics
          </button>
        ))}
      </div>

      {/* Main Chart */}
      <AdminChart />

      {/* Secondary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Device Breakdown */}
        <div className="bg-[#0e1219]/90 border border-white/5 rounded-2xl p-5 backdrop-blur-md">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-blue-400" />
            Device Distribution
          </h4>
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-zinc-300 mb-1">
                <span>Mobile Browsers / PWA</span>
                <span className="font-bold text-white">68%</span>
              </div>
              <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: '68%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-zinc-300 mb-1">
                <span>Desktop / Laptops</span>
                <span className="font-bold text-white">24%</span>
              </div>
              <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '24%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-zinc-300 mb-1">
                <span>Smart TVs / Android TV</span>
                <span className="font-bold text-white">8%</span>
              </div>
              <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '8%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Top Watched Categories */}
        <div className="bg-[#0e1219]/90 border border-white/5 rounded-2xl p-5 backdrop-blur-md">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Film className="w-4 h-4 text-purple-400" />
            Category Streaming Hours
          </h4>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02]">
              <span className="text-zinc-300">Dhallywood Blockbusters</span>
              <span className="font-mono font-bold text-white">142,500 hrs</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02]">
              <span className="text-zinc-300">Bangla Natok & Telefilms</span>
              <span className="font-mono font-bold text-white">98,200 hrs</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02]">
              <span className="text-zinc-300">Original Web Series</span>
              <span className="font-mono font-bold text-white">76,400 hrs</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02]">
              <span className="text-zinc-300">Hollywood & World Cinema</span>
              <span className="font-mono font-bold text-white">54,100 hrs</span>
            </div>
          </div>
        </div>

        {/* Retention & Churn */}
        <div className="bg-[#0e1219]/90 border border-white/5 rounded-2xl p-5 backdrop-blur-md">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Subscriber Retention
          </h4>
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[11px] text-emerald-400 block font-medium">
                30-Day Renewal Rate
              </span>
              <span className="text-2xl font-bold text-white font-mono">82.4%</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-[11px] text-zinc-400 block font-medium">
                Average Watch Time / User
              </span>
              <span className="text-lg font-bold text-white font-mono">42 mins / day</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
