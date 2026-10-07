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
  Send,
  RotateCcw,
  Check,
  X,
  Inbox,
} from 'lucide-react';
import {
  fetchAdminSupportMessages,
  fetchTicketReplies,
  submitSupportReply,
  updateSupportTicketStatus,
  SupportMessageRecord,
  SupportReplyRecord,
  SupportTicketStatus,
  SUPPORT_STATUS_EVENT,
} from '../../../services/supportService';
import { useAdmin } from '../../context/AdminContext';
import { AdminEmptyState } from '../common/AdminEmptyState';

export const SupportView: React.FC = () => {
  const { currentAdmin } = useAdmin();
  const [messages, setMessages] = useState<SupportMessageRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'in_progress' | 'resolved'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [selectedTicket, setSelectedTicket] = useState<SupportMessageRecord | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [ticketReplies, setTicketReplies] = useState<SupportReplyRecord[]>([]);
  const [replyInput, setReplyInput] = useState('');
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
      m.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;
    return matchesTab && matchesSearch && matchesCategory;
  });

  const handleOpenDetail = async (ticket: SupportMessageRecord) => {
    setSelectedTicket(ticket);
    setAdminNoteInput(ticket.adminNotes || '');
    setReplyInput('');
    const replies = await fetchTicketReplies(ticket.id);
    setTicketReplies(replies);
  };

  const handleUpdateStatus = async (status: SupportTicketStatus) => {
    if (!selectedTicket) return;
    setUpdating(true);
    try {
      await updateSupportTicketStatus({
        ticketId: selectedTicket.id,
        status,
        adminNotes: adminNoteInput.trim() || undefined,
        adminUserId: currentAdmin.id,
        targetUserId: selectedTicket.userId,
      });

      setSelectedTicket((prev) =>
        prev ? { ...prev, status, adminNotes: adminNoteInput.trim() || prev.adminNotes } : null
      );
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
      await updateSupportTicketStatus({
        ticketId: selectedTicket.id,
        status: selectedTicket.status,
        adminNotes: adminNoteInput.trim(),
        adminUserId: currentAdmin.id,
        targetUserId: selectedTicket.userId,
      });

      setSelectedTicket((prev) => (prev ? { ...prev, adminNotes: adminNoteInput.trim() } : null));
      await loadMessages();
    } catch (err) {
      console.warn('Failed to save notes:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim() || !selectedTicket) return;

    setUpdating(true);
    try {
      const res = await submitSupportReply({
        ticketId: selectedTicket.id,
        senderId: currentAdmin.id,
        senderRole: 'admin',
        senderName: currentAdmin.name || 'Support Desk',
        message: replyInput.trim(),
      });

      if (res.success && res.data) {
        setTicketReplies((prev) => [...prev, res.data!]);
        setReplyInput('');
      }
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
            Customer Support & Inquiries
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time support ticket lifecycle, user inquiry responses, and resolution desk.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadMessages}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-zinc-300 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2 p-1.5 bg-[#0e1219] border border-white/5 rounded-2xl">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>All Tickets</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 font-mono">
              {messages.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('new')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'new'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>New Inquiries</span>
            {newCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 font-bold">
                {newCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('in_progress')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'in_progress'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>In Progress</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
              {inProgressCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('resolved')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'resolved'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Resolved</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
              {resolvedCount}
            </span>
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search user, ID or subject..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#0e1219] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#0e1219] border border-white/5 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-rose-500"
          >
            <option value="all">All Categories</option>
            <option value="payment">Payment</option>
            <option value="video">Streaming</option>
            <option value="account">Account</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Messages List or Empty State */}
      {loading ? (
        <div className="p-12 text-center text-zinc-400 text-xs">
          <span className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin inline-block mb-2" />
          <p>Loading support requests from database...</p>
        </div>
      ) : messages.length === 0 ? (
        <AdminEmptyState
          icon={<Inbox className="w-10 h-10 text-zinc-600" />}
          title="No Support Tickets Yet"
          description="Customer inquiries and support messages submitted through the website will appear here in real-time."
        />
      ) : filtered.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#0e1219]/90 border border-white/5 text-center text-zinc-400 text-xs">
          No support tickets match your search criteria.
        </div>
      ) : (
        <div className="bg-[#0e1219]/90 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/30 border-b border-white/5 text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Ticket ID</th>
                  <th className="px-5 py-3.5 font-medium">User Profile</th>
                  <th className="px-5 py-3.5 font-medium">Category</th>
                  <th className="px-5 py-3.5 font-medium">Subject & Message</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 font-medium">Created Date</th>
                  <th className="px-5 py-3.5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className={`hover:bg-white/[0.02] transition-colors ${
                      ticket.status === 'new' ? 'bg-amber-500/[0.03]' : ''
                    }`}
                  >
                    <td className="px-5 py-3.5 font-mono text-[11px] text-zinc-400">
                      #{ticket.id.slice(0, 8)}
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-white">{ticket.userName}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">{ticket.userEmail}</div>
                      {ticket.userPhone && (
                        <div className="text-[10px] text-zinc-500 font-mono">{ticket.userPhone}</div>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-white/5 text-zinc-300 font-semibold uppercase text-[10px]">
                        {ticket.category}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 max-w-xs">
                      <div className="font-semibold text-white truncate">{ticket.subject}</div>
                      <div className="text-[11px] text-zinc-400 truncate mt-0.5">{ticket.message}</div>
                    </td>

                    <td className="px-5 py-3.5">
                      {ticket.status === 'resolved' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Resolved
                        </span>
                      ) : ticket.status === 'in_progress' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          In Progress
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                          New
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-zinc-400 font-mono text-[11px]">
                      {new Date(ticket.createdAt).toLocaleDateString('bn-BD')}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleOpenDetail(ticket)}
                        className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ticket Details & Lifecycle Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
          <div className="fixed inset-0" onClick={() => setSelectedTicket(null)} />

          <div className="relative z-10 w-full max-w-2xl bg-[#0c0e16] border border-white/10 rounded-3xl shadow-2xl p-5 sm:p-7 space-y-5 overflow-y-auto max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-zinc-400">#{selectedTicket.id}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/5 text-zinc-300">
                    {selectedTicket.category}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{selectedTicket.subject}</h3>
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] text-zinc-500 block">User Name</span>
                <span className="font-semibold text-white truncate block">{selectedTicket.userName}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] text-zinc-500 block">Email</span>
                <span className="font-mono text-zinc-300 truncate block">{selectedTicket.userEmail}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] text-zinc-500 block">Phone</span>
                <span className="font-mono text-zinc-300 block">{selectedTicket.userPhone || 'N/A'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] text-zinc-500 block">Created Time</span>
                <span className="text-zinc-300 block font-mono text-[11px]">
                  {new Date(selectedTicket.createdAt).toLocaleString('bn-BD', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
            </div>

            {/* Lifecycle Timestamps Card */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-[10px] text-amber-400 font-bold block">1. Submitted At</span>
                <span className="text-zinc-200 font-mono text-[11px]">
                  {new Date(selectedTicket.createdAt).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className={`p-2 rounded-xl border ${selectedTicket.inProgressAt || selectedTicket.status !== 'new' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-white/[0.02] border-white/5 text-zinc-500'}`}>
                <span className={`text-[10px] font-bold block ${selectedTicket.inProgressAt || selectedTicket.status !== 'new' ? 'text-blue-400' : 'text-zinc-500'}`}>
                  2. In Progress At
                </span>
                <span className="font-mono text-[11px] text-zinc-300">
                  {selectedTicket.inProgressAt
                    ? new Date(selectedTicket.inProgressAt).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })
                    : selectedTicket.status !== 'new' && selectedTicket.updatedAt
                    ? new Date(selectedTicket.updatedAt).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </span>
              </div>
              <div className={`p-2 rounded-xl border ${selectedTicket.resolvedAt ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/[0.02] border-white/5 text-zinc-500'}`}>
                <span className={`text-[10px] font-bold block ${selectedTicket.resolvedAt ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  3. Resolved At
                </span>
                <span className="font-mono text-[11px] text-zinc-300">
                  {selectedTicket.resolvedAt
                    ? new Date(selectedTicket.resolvedAt).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </span>
              </div>
            </div>

            {/* User Original Message */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-xs">
              <span className="text-[10px] text-zinc-500 block mb-1 uppercase tracking-wider font-semibold">
                Customer Message
              </span>
              <p className="whitespace-pre-wrap text-zinc-200">{selectedTicket.message}</p>
            </div>

            {/* Status Transition Control Bar */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">Current Status:</span>
                {selectedTicket.status === 'resolved' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Resolved
                  </span>
                ) : selectedTicket.status === 'in_progress' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    In Progress
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    New
                  </span>
                )}
              </div>

              {/* Status Mutator Buttons */}
              <div className="flex items-center gap-2">
                {selectedTicket.status !== 'in_progress' && (
                  <button
                    disabled={updating}
                    onClick={() => handleUpdateStatus('in_progress')}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
                  >
                    Mark In Progress
                  </button>
                )}

                {selectedTicket.status !== 'resolved' ? (
                  <button
                    disabled={updating}
                    onClick={() => handleUpdateStatus('resolved')}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
                  >
                    Mark Resolved
                  </button>
                ) : (
                  <button
                    disabled={updating}
                    onClick={() => handleUpdateStatus('in_progress')}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500 hover:text-black transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reopen Ticket</span>
                  </button>
                )}
              </div>
            </div>

            {/* Official Admin Note & Response (Persisted in DB & shown to user) */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-300">
                Official Admin Response / Notes (User can view this)
              </label>
              <div className="relative">
                <textarea
                  rows={3}
                  value={adminNoteInput}
                  onChange={(e) => setAdminNoteInput(e.target.value)}
                  placeholder="Type official explanation or resolution note for the customer..."
                  className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={updating}
                  onClick={handleSaveNotes}
                  className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Notes</span>
                </button>
              </div>
            </div>

            {/* Thread Replies */}
            {ticketReplies.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/5">
                <span className="text-xs font-bold text-zinc-400 uppercase">Conversation History</span>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {ticketReplies.map((r) => (
                    <div
                      key={r.id}
                      className={`p-2.5 rounded-xl text-xs ${
                        r.senderRole === 'admin'
                          ? 'bg-rose-950/30 border border-rose-500/20 text-rose-200'
                          : 'bg-white/5 border border-white/5 text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                        <span className="font-bold text-zinc-400">
                          {r.senderName} ({r.senderRole.toUpperCase()})
                        </span>
                        <span>{new Date(r.createdAt).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="whitespace-pre-wrap">{r.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Reply */}
            <form onSubmit={handleSendAdminReply} className="pt-2 border-t border-white/5 flex gap-2">
              <input
                type="text"
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
                placeholder="Send a direct message reply to this customer..."
                className="flex-1 px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
              />
              <button
                type="submit"
                disabled={!replyInput.trim() || updating}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
