import React, { useState } from 'react';
import { Users, Search, Plus, Filter, Eye, Edit2, Ban, CheckCircle, ShieldAlert, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { AdminStatusBadge } from '../common/AdminStatusBadge';
import { AdminUserAvatar } from '../common/AdminUserAvatar';
import { AdminFilterBar } from '../common/AdminFilterBar';
import { AdminEmptyState } from '../common/AdminEmptyState';
import { UserDetailModal } from '../modals/UserDetailModal';
import { AddUserModal } from '../modals/AddUserModal';
import { AdminCustomerUser } from '../../types/adminTypes';
import { AdminPagination } from '../common/AdminPagination';

export const UsersView: React.FC = () => {
  const { users, updateUserStatus, isLoadingData, usersError, refreshUsers } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<AdminCustomerUser | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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

  const itemsPerPage = 8;
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
            Real production customer records, VIP passes, and account controls from Supabase.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="text-xs font-mono text-zinc-400">
            Total Users: <span className="text-white font-bold">{usersError ? '—' : users.length}</span>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-950/40 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create User</span>
          </button>
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
              { label: 'Suspended', value: 'suspended' },
            ],
          },
          {
            name: 'Subscription',
            selectedValue: tierFilter,
            onChange: setTierFilter,
            options: [
              { label: 'All Subscriptions', value: 'all' },
              { label: 'VIP Subscribers', value: 'vip' },
              { label: 'Standard Pass', value: 'standard' },
              { label: 'Free Tier', value: 'free' },
            ],
          },
        ]}
      />

      {/* Users Table or Empty State */}
      {isLoadingData ? (
        <div className="p-12 text-center text-zinc-400 text-xs">
          <span className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin inline-block mb-2" />
          <p>Loading user directory from database...</p>
        </div>
      ) : usersError ? (
        <div className="p-8 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-950/50">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-bold text-white font-['Cinzel',serif]">
              Unable to Load Users (ব্যবহারকারী তালিকা লোড করা সম্ভব হয়নি)
            </h3>
            <p className="text-xs text-rose-300 font-medium">
              {usersError}
            </p>
            <p className="text-[11px] text-zinc-400">
              Your administrative session or database permissions could not be verified. Please check your credentials or try again.
            </p>
          </div>
          <button
            onClick={() => refreshUsers()}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-950/40 inline-flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Loading Users</span>
          </button>
        </div>
      ) : users.length === 0 ? (
        <AdminEmptyState
          icon={<Users className="w-10 h-10 text-zinc-600" />}
          title="No Users Registered Yet"
          description="Real user accounts created on ChitroKatha will automatically appear here in real-time."
          actionText="Create First User"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="bg-[#0e1219]/90 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/30 border-b border-white/5 text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5 font-medium">User Profile</th>
                  <th className="px-5 py-3.5 font-medium">Contact</th>
                  <th className="px-5 py-3.5 font-medium">Subscription</th>
                  <th className="px-5 py-3.5 font-medium">Role</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 font-medium">Joined Date</th>
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
                          <span className="font-semibold text-white truncate block">{user.name}</span>
                          <span className="font-mono text-[10px] text-zinc-500 block truncate">
                            #{user.id.slice(0, 8)}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 font-mono text-zinc-300">
                      <div>{user.email}</div>
                      {user.phone && <div className="text-[10px] text-zinc-400">{user.phone}</div>}
                    </td>

                    <td className="px-5 py-3.5">
                      <AdminStatusBadge status={user.subscription} type="tier" />
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-zinc-300 font-mono uppercase">
                        {user.role || 'user'}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <AdminStatusBadge status={user.status} type="user" />
                    </td>

                    <td className="px-5 py-3.5 text-zinc-400 font-mono text-[11px]">{user.joinedDate}</td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedUser(user)}
                          title="Manage user profile and password"
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                        >
                          Manage
                        </button>

                        <button
                          onClick={() => {
                            const nextStatus = user.status === 'suspended' ? 'active' : 'suspended';
                            updateUserStatus(user.id, nextStatus);
                          }}
                          title={user.status === 'suspended' ? 'Re-activate Account' : 'Suspend Account'}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            user.status === 'suspended'
                              ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20'
                              : 'text-zinc-500 border-white/5 hover:text-rose-400 hover:bg-rose-500/10'
                          }`}
                        >
                          {user.status === 'suspended' ? (
                            <CheckCircle className="w-3.5 h-3.5" />
                          ) : (
                            <Ban className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filtered.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      )}

      {/* User Details & Edit Modal */}
      <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />

      {/* Create User Modal */}
      <AddUserModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </div>
  );
};
