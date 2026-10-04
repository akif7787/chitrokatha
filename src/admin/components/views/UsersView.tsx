import React, { useState } from 'react';
import { Users, Search, Filter, Eye, Edit2, Ban, CheckCircle } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { AdminStatusBadge } from '../common/AdminStatusBadge';
import { AdminUserAvatar } from '../common/AdminUserAvatar';
import { AdminFilterBar } from '../common/AdminFilterBar';
import { UserDetailModal } from '../modals/UserDetailModal';
import { AdminCustomerUser } from '../../types/adminTypes';
import { AdminPagination } from '../common/AdminPagination';

export const UsersView: React.FC = () => {
  const { users, updateUserStatus } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<AdminCustomerUser | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone && u.phone.includes(searchTerm));
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    const matchesTier = tierFilter === 'all' || u.tier === tierFilter;
    return matchesSearch && matchesStatus && matchesTier;
  });

  const itemsPerPage = 6;
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-['Cinzel',serif]">
            User Directory & Subscribers
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Manage ChitroKatha member accounts, VIP subscriber passes, and status controls.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono text-zinc-400">
          Total Users: <span className="text-white font-bold">{users.length}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <AdminFilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by name, email or phone..."
        filters={[
          {
            name: 'Status',
            selectedValue: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'All Statuses', value: 'all' },
              { label: 'Active', value: 'active' },
              { label: 'Suspended', value: 'suspended' }
            ]
          },
          {
            name: 'Subscription',
            selectedValue: tierFilter,
            onChange: setTierFilter,
            options: [
              { label: 'All Subscriptions', value: 'all' },
              { label: 'VIP Subscribers', value: 'vip' },
              { label: 'Basic / Weekly Pass', value: 'basic' },
              { label: 'Free Tier', value: 'free' }
            ]
          }
        ]}
      />

      {/* Users Table */}
      <div className="bg-[#0e1219]/90 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/30 border-b border-white/5 text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5 font-medium">User Profile</th>
                <th className="px-5 py-3.5 font-medium">Contact</th>
                <th className="px-5 py-3.5 font-medium">Subscription</th>
                <th className="px-5 py-3.5 font-medium">Status</th>
                <th className="px-5 py-3.5 font-medium">Joined Date</th>
                <th className="px-5 py-3.5 font-medium">Last Login</th>
                <th className="px-5 py-3.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginated.map((user) => (
                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <AdminUserAvatar name={user.name} avatarUrl={user.avatar} size="sm" />
                      <div className="min-w-0">
                        <div className="font-semibold text-white truncate">{user.name}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">#{user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="text-zinc-300 truncate">{user.email}</div>
                    <div className="text-[10px] text-zinc-500 font-mono">{user.phone || '—'}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <AdminStatusBadge status={user.subscription} type="tier" />
                  </td>
                  <td className="px-5 py-3.5">
                    <AdminStatusBadge status={user.status} type="user" />
                  </td>
                  <td className="px-5 py-3.5 text-zinc-400">{user.joinedDate}</td>
                  <td className="px-5 py-3.5 text-zinc-400 font-mono text-[11px]">
                    {user.lastLogin}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSelectedUser(user)}
                        title="View Profile"
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          const next = user.status === 'suspended' ? 'active' : 'suspended';
                          updateUserStatus(user.id, next);
                        }}
                        title={user.status === 'suspended' ? 'Activate' : 'Suspend'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          user.status === 'suspended'
                            ? 'text-emerald-400 hover:bg-emerald-500/10'
                            : 'text-rose-400 hover:bg-rose-500/10'
                        }`}
                      >
                        {user.status === 'suspended' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Ban className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* User Detail Modal */}
      <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />
    </div>
  );
};
