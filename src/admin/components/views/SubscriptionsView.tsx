import React, { useState } from 'react';
import { Sparkles, Plus, Check, Edit2, ShieldCheck, Zap } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { AddPlanModal } from '../modals/AddPlanModal';

export const SubscriptionsView: React.FC = () => {
  const { plans, togglePlanStatus } = useAdmin();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-['Cinzel',serif]">
            Subscription Plans & VIP Tiers
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Configure pricing tiers, multi-device limits, and OTT streaming privileges.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-lg shadow-rose-600/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Plan</span>
        </button>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative bg-[#0e1219]/90 border rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-black/80 hover:-translate-y-1 ${
              plan.isActive
                ? 'border-white/10 hover:border-rose-500/40'
                : 'border-white/5 opacity-60'
            }`}
          >
            {/* Top Badge */}
            {plan.badge && (
              <div className="absolute -top-3 left-6">
                <span className="px-3 py-1 text-[10px] font-bold text-white bg-gradient-to-r from-rose-600 to-amber-600 rounded-full uppercase tracking-wider shadow-md">
                  {plan.badge}
                </span>
              </div>
            )}

            <div>
              <div className="flex items-start justify-between mt-1 mb-4">
                <div>
                  <h3 className="text-base font-bold text-white">{plan.name}</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">{plan.durationLabel}</p>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                    plan.isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-zinc-800 text-zinc-500 border-zinc-700/40'
                  }`}
                >
                  {plan.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Price Tag */}
              <div className="mb-5 pb-4 border-b border-white/5">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white font-mono">৳{plan.price}</span>
                  <span className="text-xs text-zinc-400">/ {plan.durationLabel}</span>
                </div>
                <div className="text-[11px] text-zinc-500 mt-1">
                  {plan.subscribersCount} Active Subscribers
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-2.5 mb-6">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Included Privileges:
                </div>
                {plan.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                    <Check className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-2">
              <button
                onClick={() => togglePlanStatus(plan.id)}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                  plan.isActive
                    ? 'text-zinc-400 hover:text-white border-white/10 hover:bg-white/5'
                    : 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20'
                }`}
              >
                {plan.isActive ? 'Deactivate' : 'Activate'}
              </button>

              <button
                onClick={() => alert(`Editing plan ${plan.name} (UI Mock)`)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl border border-white/5"
                title="Edit Plan"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <AddPlanModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
};
