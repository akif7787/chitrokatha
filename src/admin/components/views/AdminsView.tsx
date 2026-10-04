import React, { useState } from 'react';
import { ShieldCheck, Plus, UserCheck, ShieldAlert, Mail } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { AdminStatusBadge } from '../common/AdminStatusBadge';
import { AdminUserAvatar } from '../common/AdminUserAvatar';
import { AddAdminModal } from '../modals/AddAdminModal';

export const AdminsView: React.FC = () => {
  const { admins } = useAdmin();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-['Cinzel',serif]">
            Admin Team & Role Management
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Manage console administrators, role permissions (Super Admin, Content, Support).
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-lg shadow-rose-600/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Invite Admin</span>
        </button>
      </div>

      {/* Admin Table */}
      <div className="bg-[#0e1219]/90 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/30 border-b border-white/5 text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5 font-medium">Team Member</th>
                <th className="px-5 py-3.5 font-medium">Email</th>
                <th className="px-5 py-3.5 font-medium">Role</th>
                <th className="px-5 py-3.5 font-medium">Status</th>
                <th className="px-5 py-3.5 font-medium">Last Login</th>
                <th className="px-5 py-3.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {admins.map((adm) => (
                <tr key={adm.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <AdminUserAvatar name={adm.name} avatarUrl={adm.avatar} size="sm" showOnline />
                      <div>
                        <div className="font-semibold text-white">{adm.name}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">#{adm.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-zinc-300 font-mono">{adm.email}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{adm.roleTitle}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <AdminStatusBadge status={adm.status} type="user" />
                  </td>
                  <td className="px-5 py-3.5 text-zinc-400 font-mono">{adm.lastLogin}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => alert(`Manage permissions for ${adm.name}`)}
                      className="px-2.5 py-1 text-xs text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      Permissions
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AddAdminModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
};
