import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { AdminModal } from '../common/AdminModal';
import { AdminAccount, AdminRole } from '../../types/adminTypes';
import { ShieldCheck, Plus } from 'lucide-react';

interface AddAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddAdminModal: React.FC<AddAdminModalProps> = ({ isOpen, onClose }) => {
  const { addAdmin } = useAdmin();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AdminRole>('content_manager');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const roleTitles: Record<AdminRole, string> = {
      super_admin: 'Super Admin',
      admin: 'Administrator',
      content_manager: 'Content Manager',
      support_manager: 'Support & Finance'
    };

    const newAdmin: AdminAccount = {
      id: `adm-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      role,
      roleTitle: roleTitles[role],
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      status: 'active',
      lastLogin: 'Just Invited',
      permissions: ['manage_content']
    };

    addAdmin(newAdmin);
    onClose();
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite Team Member"
      subtitle="Assign role-based access for ChitroKatha console"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Full Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mahfuz Anam"
            className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Corporate Email *</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. mahfuz@chitrokatha.com"
            className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Role / Permissions</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as AdminRole)}
            className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
          >
            <option value="content_manager">Content Manager (Movies, Dramas, Series)</option>
            <option value="support_manager">Support & Finance Manager (Trx & Users)</option>
            <option value="admin">Administrator (General Operations)</option>
            <option value="super_admin">Super Admin (Unrestricted System Access)</option>
          </select>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-lg shadow-rose-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Send Invitation</span>
          </button>
        </div>
      </form>
    </AdminModal>
  );
};
