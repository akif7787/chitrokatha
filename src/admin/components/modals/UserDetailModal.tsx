import React from 'react';
import { useAdmin } from '../../context/AdminContext';
import { AdminModal } from '../common/AdminModal';
import { AdminCustomerUser } from '../../types/adminTypes';
import { AdminUserAvatar } from '../common/AdminUserAvatar';
import { AdminStatusBadge } from '../common/AdminStatusBadge';
import { Mail, Phone, Calendar, Clock, Film, Ban, CheckCircle, ShieldAlert } from 'lucide-react';

interface UserDetailModalProps {
  user: AdminCustomerUser | null;
  onClose: () => void;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, onClose }) => {
  const { updateUserStatus } = useAdmin();

  if (!user) return null;

  const handleToggleSuspend = () => {
    const nextStatus = user.status === 'suspended' ? 'active' : 'suspended';
    updateUserStatus(user.id, nextStatus);
    onClose();
  };

  return (
    <AdminModal
      isOpen={!!user}
      onClose={onClose}
      title="User Profile & Activity"
      subtitle={`User ID: #${user.id}`}
      maxWidth="md"
    >
      <div className="space-y-5">
        {/* Profile Card Header */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
          <AdminUserAvatar name={user.name} avatarUrl={user.avatar} size="lg" />
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-bold text-white truncate">{user.name}</h4>
            <p className="text-xs text-zinc-400 truncate">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <AdminStatusBadge status={user.status} type="user" />
              <AdminStatusBadge status={user.subscription} type="tier" />
            </div>
          </div>
        </div>

        {/* User Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-zinc-500 flex items-center gap-1.5 mb-1">
              <Phone className="w-3.5 h-3.5 text-blue-400" />
              Phone
            </span>
            <p className="text-zinc-200 font-mono">{user.phone || 'Not provided'}</p>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-zinc-500 flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              Joined Date
            </span>
            <p className="text-zinc-200">{user.joinedDate}</p>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-zinc-500 flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Last Active
            </span>
            <p className="text-zinc-200">{user.lastLogin}</p>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-zinc-500 flex items-center gap-1.5 mb-1">
              <Film className="w-3.5 h-3.5 text-rose-400" />
              Watched Content
            </span>
            <p className="text-rose-400 font-bold">{user.watchHistoryCount} titles</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <button
            onClick={handleToggleSuspend}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
              user.status === 'suspended'
                ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20'
                : 'text-rose-400 border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20'
            }`}
          >
            {user.status === 'suspended' ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Re-activate User</span>
              </>
            ) : (
              <>
                <Ban className="w-4 h-4" />
                <span>Suspend Account</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-white/5 rounded-xl hover:bg-white/10"
          >
            Close
          </button>
        </div>
      </div>
    </AdminModal>
  );
};
