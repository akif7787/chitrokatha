import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Filter,
  RefreshCw,
  Mail,
  Phone,
  User,
  Tag,
  Calendar,
  Save,
  X
} from 'lucide-react';
import {
  fetchAdminSupportMessages,
  updateSupportMessageStatus,
  SupportMessageRecord,
  SupportTicketStatus,
  SUPPORT_STATUS_EVENT
} from '../../../services/supportService';

export const SupportView: React.FC = () => {
  const [messages, setMessages] = useState<SupportMessageRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'in_progress' | 'resolved'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportMessageRecord | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminSupportMessages();
      setMessages(data);
    } catch (err) {
      console.warn('Error loading support messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();

    const handleEvent = () => loadMessages();
    window.addEventListener(SUPPORT_STATUS_EVENT, handleEvent);
    return () => window.removeEventListener(SUPPORT_STATUS_EVENT, handleEvent);
  }, []);

  const newCount = messages.filter((m) => m.status === 'new').length;
  const inProgressCount = messages.filter((m) => m.status === 'in_progress').length;
  const resolvedCount = messages.filter((m) => m.status === 'resolved').length;

  const filtered = messages.filter((m) => {
    const matchesTab = activeTab === 'all' || m.status === activeTab;
    const matchesSearch =
      m.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.userPhone && m.userPhone.includes(searchTerm)) ||
      m.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;
    return matchesTab && matchesSearch && matchesCategory;
  });

  const handleOpenDetail = (ticket: SupportMessageRecord) => {
    setSelectedTicket(ticket);
    setAdminNoteInput(ticket.adminNotes || '');
  };

  const handleUpdateStatus = async (status: SupportTicketStatus) => {
    if (!selectedTicket) return;
    setUpdating(true);
    try {
      await updateSupportMessageStatus(selectedTicket.id, status, adminNoteInput.trim());
      setSelectedTicket((prev) => (prev ? { ...prev, status, adminNotes: adminNoteInput.trim() } : null));
      await loadMessages();
    } catch (err) {
      console.warn('Failed to update ticket status:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedTicket) return;
    setUpdating(true);
    try {
      await updateSupportMessageStatus(selectedTicket.id, selectedTicket.status, adminNoteInput.trim());
      setSelectedTicket((prev) => (prev ? { ...prev, adminNotes: adminNoteInput.trim() } : null));
      await loadMessages();
    } catch (err) {
      console.warn('Failed to save notes:', err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-['Cinzel',serif]">
            User Support & Help Messages
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Review and resolve support inquiries, payment verification issues, and user feedback.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadMessages}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 transition-all border border-white/5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            Refresh
          </button>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="px-2.5 py-1 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-semibold">
              {newCount} New
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold">
              {inProgressCount} In Progress
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-[#0e1219] border border-white/5 rounded-2xl">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'all'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          All Tickets ({messages.length})
        </button>
        <button
          onClick={() => setActiveTab('new')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'new'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          New ({newCount})
        </button>
        <button
          onClick={() => setActiveTab('in_progress')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'in_progress'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          In Progress ({inProgressCount})
        </button>
        <button
          onClick={() => setActiveTab('resolved')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'resolved'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Resolved ({resolvedCount})
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by user, email, subject, phone, message content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0e1219] border border-white/5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl bg-[#0e1219] border border-white/5 text-xs text-zinc-300 focus:outline-none focus:border-rose-500"
        >
          <option value="all">All Categories</option>
          <option value="payment">Payment & Billing</option>
          <option value="video">Video & Playback</option>
          <option value="account">Account & Login</option>
          <option value="other">General / Other</option>
        </select>
      </div>

      {/* Messages List */}
      <div className="bg-[#0e1219] border border-white/5 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-xs">
            <MessageSquare className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
            No support messages match the criteria.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => handleOpenDetail(ticket)}
                className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] cursor-pointer transition-colors ${
                  ticket.status === 'new' ? 'bg-rose-500/[0.03]' : ''
                }`}
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {ticket.status === 'new' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        NEW
                      </span>
                    )}
                    {ticket.status === 'in_progress' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        IN PROGRESS
                      </span>
                    )}
                    {ticket.status === 'resolved' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        RESOLVED
                      </span>
                    )}
                    <span className="text-[11px] font-medium text-amber-400 uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-md">
                      {ticket.category}
                    </span>
                    <span className="text-xs font-bold text-white truncate max-w-md">
                      {ticket.subject}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {ticket.message}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500 pt-1">
                    <span className="flex items-center gap-1 text-zinc-400 font-medium">
                      <User className="w-3 h-3 text-zinc-500" />
                      {ticket.userName}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Mail className="w-3 h-3 text-zinc-500" />
                      {ticket.userEmail}
                    </span>
                    {ticket.userPhone && (
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-zinc-500" />
                        {ticket.userPhone}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-zinc-500" />
                      {new Date(ticket.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetail(ticket);
                    }}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all text-xs flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">View</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setSelectedTicket(null)} />

          <div className="relative z-10 w-full max-w-2xl bg-[#0c0e16] border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    {selectedTicket.status.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-amber-400 font-semibold">
                    Category: {selectedTicket.category}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">
                  {selectedTicket.subject}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Info Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5 text-xs">
              <div>
                <span className="text-zinc-500 block">User Name:</span>
                <span className="text-white font-bold">{selectedTicket.userName}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Email Address:</span>
                <span className="text-sky-400 font-mono select-all">{selectedTicket.userEmail}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Phone:</span>
                <span className="text-zinc-300 font-mono select-all">{selectedTicket.userPhone || 'N/A'}</span>
              </div>
            </div>

            {/* Message Body */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400">User's Message:</label>
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-xs sm:text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap font-sans">
                {selectedTicket.message}
              </div>
              <span className="text-[10px] text-zinc-500 block">
                Submitted: {new Date(selectedTicket.createdAt).toLocaleString()}
              </span>
            </div>

            {/* Internal Admin Notes */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400">Internal Admin Notes / Action Taken:</label>
              <textarea
                rows={3}
                value={adminNoteInput}
                onChange={(e) => setAdminNoteInput(e.target.value)}
                placeholder="Write internal notes about verification, contact made, or resolution steps..."
                className="w-full p-3 rounded-xl bg-black/30 border border-white/10 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-rose-500"
              />
              <button
                onClick={handleSaveNotes}
                disabled={updating}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-zinc-300 hover:text-white transition-all flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                Save Note Only
              </button>
            </div>

            {/* Status Change Action Buttons */}
            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleUpdateStatus('new')}
                  disabled={updating || selectedTicket.status === 'new'}
                  className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-all disabled:opacity-40"
                >
                  Mark New
                </button>
                <button
                  onClick={() => handleUpdateStatus('in_progress')}
                  disabled={updating || selectedTicket.status === 'in_progress'}
                  className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-all disabled:opacity-40"
                >
                  Mark In Progress
                </button>
                <button
                  onClick={() => handleUpdateStatus('resolved')}
                  disabled={updating || selectedTicket.status === 'resolved'}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 disabled:opacity-40"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mark Resolved
                </button>
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-zinc-400 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
