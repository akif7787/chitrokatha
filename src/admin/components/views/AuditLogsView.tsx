import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { ShieldAlert, Search, RefreshCw, Clock, Filter, Terminal, User, Activity } from 'lucide-react';
import { AdminEmptyState } from '../common/AdminEmptyState';

export const AuditLogsView: React.FC = () => {
  const { auditLogs, refreshAuditLogs, isLoadingData } = useAdmin();
  const [filterAction, setFilterAction] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const actions = ['all', 'create_user', 'reset_password', 'update_user', 'approve_payment', 'reject_payment', 'create_ad_campaign', 'delete_ad_campaign'];

  const filteredLogs = auditLogs.filter((log) => {
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    const matchesSearch =
      searchTerm === '' ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.entityType && log.entityType.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.adminName && log.adminName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.adminUserId && log.adminUserId.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesAction && matchesSearch;
  });

  const getActionColor = (action: string) => {
    if (action.includes('approve') || action.includes('create')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (action.includes('reject') || action.includes('delete')) return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    if (action.includes('password') || action.includes('reset')) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-['Cinzel',serif]">
            Security & Admin Audit Trail
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Immutable log of sensitive administrative actions, user updates, and payment verdicts.
          </p>
        </div>

        <button
          onClick={() => refreshAuditLogs()}
          disabled={isLoadingData}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/10 border border-white/10 rounded-xl transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by action, admin, entity type..."
            className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-500" />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
          >
            {actions.map((act) => (
              <option key={act} value={act}>
                {act === 'all' ? 'All Action Types' : act.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      {filteredLogs.length === 0 ? (
        <AdminEmptyState
          title="No audit entries found"
          description="Administrative actions (payment verdicts, user creations, role changes, and ad campaigns) will appear here automatically."
          icon={<Terminal className="w-10 h-10 text-zinc-600" />}
        />
      ) : (
        <div className="bg-[#0e1219]/90 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/30 border-b border-white/5 text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 font-medium">Timestamp</th>
                  <th className="px-5 py-3 font-medium">Action</th>
                  <th className="px-5 py-3 font-medium">Entity Type</th>
                  <th className="px-5 py-3 font-medium">Entity ID</th>
                  <th className="px-5 py-3 font-medium">Metadata / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 text-zinc-400 font-mono whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase border ${getActionColor(log.action)}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-zinc-300 capitalize">
                      {log.entityType || '—'}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-zinc-400 text-[11px] max-w-[120px] truncate" title={log.entityId}>
                      {log.entityId || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-300 font-mono text-[11px] max-w-xs truncate">
                      {log.metadata ? JSON.stringify(log.metadata) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
