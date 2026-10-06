import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { AdminModal } from '../common/AdminModal';
import { AdminCustomerUser, UserStatus, SubscriptionTierType } from '../../types/adminTypes';
import { AdminUserAvatar } from '../common/AdminUserAvatar';
import { AdminStatusBadge } from '../common/AdminStatusBadge';
import {
  Mail,
  Phone,
  Calendar,
  Clock,
  Ban,
  CheckCircle,
  Key,
  Shield,
  Save,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface UserDetailModalProps {
  user: AdminCustomerUser | null;
  onClose: () => void;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, onClose }) => {
  const { updateUserStatus, resetUserPassword, editUserProfile } = useAdmin();

  const [activeTab, setActiveTab] = useState<'profile' | 'edit' | 'password'>('profile');

  // Edit fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<UserStatus>('active');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [tier, setTier] = useState<SubscriptionTierType>('free');

  // Password reset fields
  const [newPassword, setNewPassword] = useState('');
  const [isResettingPass, setIsResettingPass] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [copiedId, setCopiedId] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.name);
      setEmail(user.email);
      setPhone(user.phone || '');
      setStatus(user.status);
      setRole((user.role === 'admin' || user.role === 'super_admin') ? 'admin' : 'user');
      setTier(user.tier);
      setActiveTab('profile');
      setStatusMsg(null);
      setNewPassword('');
    }
  }, [user]);

  if (!user) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1500);
  };

  const handleToggleSuspend = async () => {
    const nextStatus = user.status === 'suspended' ? 'active' : 'suspended';
    await updateUserStatus(user.id, nextStatus);
    onClose();
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setStatusMsg(null);

    try {
      const res = await editUserProfile({
        userId: user.id,
        email: email.trim().toLowerCase() !== user.email.toLowerCase() ? email.trim().toLowerCase() : undefined,
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        role,
        status,
        plan: tier === 'basic' ? 'standard' : tier,
      });

      if (!res.success) {
        setStatusMsg({ type: 'error', text: res.error || 'Failed to update profile' });
      } else {
        setStatusMsg({ type: 'success', text: 'User profile updated successfully in Supabase!' });
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Error saving user' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setStatusMsg({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setIsResettingPass(true);
    setStatusMsg(null);

    try {
      const res = await resetUserPassword(user.id, newPassword);
      if (!res.success) {
        setStatusMsg({ type: 'error', text: res.error || 'Failed to reset password' });
      } else {
        setStatusMsg({ type: 'success', text: 'User password reset successfully in Supabase Auth!' });
        setNewPassword('');
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Error updating password' });
    } finally {
      setIsResettingPass(false);
    }
  };

  return (
    <AdminModal
      isOpen={!!user}
      onClose={onClose}
      title="User Management & Details"
      subtitle={`Supabase Auth UUID: ${user.id}`}
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Status Alert Banner */}
        {statusMsg && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Profile Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center gap-3.5 min-w-0">
            <AdminUserAvatar name={user.name} avatarUrl={user.avatar} size="lg" />
            <div className="min-w-0">
              <h4 className="text-base font-bold text-white truncate">{user.name}</h4>
              <p className="text-xs text-zinc-400 truncate">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <AdminStatusBadge status={user.status} type="user" />
                <AdminStatusBadge status={user.subscription} type="tier" />
                {user.role && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                    {user.role}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Immutable UUID Copy */}
          <div className="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-white/10 text-xs self-start sm:self-auto">
            <span className="font-mono text-zinc-400 text-[11px] truncate max-w-[130px] sm:max-w-[170px]">
              {user.id}
            </span>
            <button
              type="button"
              onClick={handleCopyId}
              title="Copy Supabase Auth UUID"
              className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex p-1 bg-black/40 border border-white/5 rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'profile' ? 'bg-rose-600 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'edit' ? 'bg-rose-600 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Edit User Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'password' ? 'bg-rose-600 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Set / Reset Password
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-zinc-500 flex items-center gap-1.5 mb-1">
                  <Phone className="w-3.5 h-3.5 text-blue-400" />
                  Phone Number
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
                <span className="text-zinc-500 block mb-1">Subscription Plan</span>
                <p className="text-amber-300 font-bold">{user.subscription}</p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-zinc-500 block mb-1">Start Date</span>
                <p className="text-zinc-300 font-mono text-[11px]">
                  {user.subscriptionStartDate
                    ? new Date(user.subscriptionStartDate).toLocaleDateString('bn-BD')
                    : 'N/A'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-zinc-500 block mb-1">Expiry Date</span>
                <p className="text-zinc-300 font-mono text-[11px]">
                  {user.subscriptionEndDate
                    ? new Date(user.subscriptionEndDate).toLocaleDateString('bn-BD')
                    : 'N/A'}
                </p>
              </div>
            </div>

            {/* Quick Toggle Suspend */}
            <div className="flex items-center justify-between pt-3 border-t border-white/5">
              <button
                type="button"
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
                    <span>Re-activate User Account</span>
                  </>
                ) : (
                  <>
                    <Ban className="w-4 h-4" />
                    <span>Suspend Account</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: EDIT PROFILE */}
        {activeTab === 'edit' && (
          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Email Address (Supabase Auth)</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="user">Regular User</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>

            {/* Role & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Account Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            {/* Subscription Tier */}
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Subscription Plan</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'free', label: 'Free' },
                  { id: 'standard', label: 'Standard (30d)' },
                  { id: 'vip', label: 'VIP (365d)' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setTier(p.id as any)}
                    className={`p-2 rounded-xl border text-xs font-medium transition-all text-center ${
                      tier === p.id
                        ? 'bg-rose-600/20 border-rose-500 text-rose-300 font-bold'
                        : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-white/5">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-950/40"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingProfile ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: SET/RESET PASSWORD */}
        {activeTab === 'password' && (
          <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
              <p className="font-semibold mb-0.5">Administrative Password Override</p>
              <p className="text-[11px] text-amber-200/80">
                You can set a new password for this user. For security, existing passwords cannot be viewed or retrieved.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">New Password</label>
              <div className="relative">
                <Key className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-white/5">
              <button
                type="submit"
                disabled={isResettingPass || !newPassword}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-950/40"
              >
                <Key className="w-3.5 h-3.5" />
                <span>{isResettingPass ? 'Updating...' : 'Set New Password'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminModal>
  );
};
