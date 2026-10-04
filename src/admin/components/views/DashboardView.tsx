import React from 'react';
import {
  Users,
  Sparkles,
  DollarSign,
  Film,
  ArrowRight,
  Eye,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Flame,
  Star
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { adminKpis, topCinematicContent } from '../../data/adminMockData';
import { AdminKpiCard } from '../common/AdminKpiCard';
import { AdminChart } from '../common/AdminChart';
import { AdminStatusBadge } from '../common/AdminStatusBadge';
import { AdminUserAvatar } from '../common/AdminUserAvatar';
import { AdminPayment } from '../../types/adminTypes';

export const DashboardView: React.FC = () => {
  const {
    currentAdmin,
    payments,
    users,
    navigate,
    setSelectedPayment,
    updatePaymentStatus
  } = useAdmin();

  const recentPayments = payments.slice(0, 5);
  const recentUsers = users.slice(0, 5);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getKpiIcon = (id: string) => {
    switch (id) {
      case 'users':
        return <Users className="w-5 h-5 text-blue-400" />;
      case 'vip':
        return <Sparkles className="w-5 h-5 text-amber-400" />;
      case 'revenue':
        return <DollarSign className="w-5 h-5 text-rose-400" />;
      case 'content':
      default:
        return <Film className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-white font-['Cinzel',serif]">
            {getGreeting()}, {currentAdmin.name} 👋
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Here's what's happening with <span className="text-rose-400 font-semibold">ChitroKatha</span> today.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => navigate('/admin/movies')}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-lg shadow-rose-600/20"
          >
            + Add New Content
          </button>
          <button
            onClick={() => navigate('/admin/payments')}
            className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/10 border border-white/5 rounded-xl transition-all"
          >
            Review Payments
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {adminKpis.map((kpi) => (
          <AdminKpiCard
            key={kpi.id}
            title={kpi.title}
            value={kpi.value}
            change={kpi.change}
            isPositive={kpi.isPositive}
            timeframe={kpi.timeframe}
            icon={getKpiIcon(kpi.id)}
            accent={kpi.accent}
          />
        ))}
      </div>

      {/* Revenue Section with Minimal Chart */}
      <AdminChart />

      {/* Recent Payments Section */}
      <div className="bg-[#0e1219]/90 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <h3 className="text-sm font-bold text-white">Recent Payments</h3>
          </div>
          <button
            onClick={() => navigate('/admin/payments')}
            className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors"
          >
            <span>View All Payments</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/30 border-b border-white/5 text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Plan</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Method</th>
                <th className="px-5 py-3 font-medium">Trx ID</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentPayments.map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <AdminUserAvatar name={p.userName} avatarUrl={p.userAvatar} size="sm" />
                      <div>
                        <div className="font-semibold text-white">{p.userName}</div>
                        <div className="text-[10px] text-zinc-400">{p.userEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-medium text-zinc-300">{p.planName}</td>
                  <td className="px-5 py-3.5 font-bold text-emerald-400 font-mono">৳{p.amount}</td>
                  <td className="px-5 py-3.5 capitalize font-mono text-zinc-300">
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                      {p.method}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-zinc-400 text-[11px]">{p.trxId}</td>
                  <td className="px-5 py-3.5 text-zinc-400">{p.date}</td>
                  <td className="px-5 py-3.5">
                    <AdminStatusBadge status={p.status} type="payment" />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedPayment(p)}
                        title="View details"
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {p.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updatePaymentStatus(p.id, 'approved')}
                            title="Quick Approve"
                            className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updatePaymentStatus(p.id, 'rejected')}
                            title="Quick Reject"
                            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Grid: Recent Users & Top Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users Section */}
        <div className="bg-[#0e1219]/90 border border-white/5 rounded-2xl p-5 backdrop-blur-md">
          <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <h3 className="text-sm font-bold text-white">Recent Users</h3>
            </div>
            <button
              onClick={() => navigate('/admin/users')}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium"
            >
              View All →
            </button>
          </div>

          <div className="divide-y divide-white/5">
            {recentUsers.map((u) => (
              <div key={u.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <AdminUserAvatar name={u.name} avatarUrl={u.avatar} size="sm" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{u.name}</p>
                    <p className="text-[11px] text-zinc-400 truncate">{u.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <AdminStatusBadge status={u.subscription} type="tier" />
                  <AdminStatusBadge status={u.status} type="user" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Content Section */}
        <div className="bg-[#0e1219]/90 border border-white/5 rounded-2xl p-5 backdrop-blur-md">
          <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-500" />
              <h3 className="text-sm font-bold text-white">Top Performing Content</h3>
            </div>
            <button
              onClick={() => navigate('/admin/movies')}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium"
            >
              Manage Catalog →
            </button>
          </div>

          <div className="space-y-3">
            {topCinematicContent.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-white/[0.03] transition-colors"
              >
                <div className="relative w-12 h-16 rounded-lg overflow-hidden shrink-0 bg-black/60 border border-white/10">
                  <img
                    src={item.poster}
                    alt={item.titleEn}
                    className="w-full h-full object-cover"
                  />
                  {item.isTop10 && (
                    <span className="absolute top-0 left-0 bg-rose-600 text-white font-bold text-[9px] px-1 rounded-br">
                      #{item.isTop10}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white truncate">
                      {item.titleEn} ({item.titleBn})
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                    {item.industry} • {item.genre}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1 text-amber-400 font-semibold">
                      <Star className="w-3 h-3 fill-amber-400" />
                      {item.rating}
                    </span>
                    <span>{item.views} views</span>
                    <span className="capitalize text-zinc-500 font-mono">
                      {item.type}
                    </span>
                  </div>
                </div>

                <AdminStatusBadge status={item.status} type="content" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
