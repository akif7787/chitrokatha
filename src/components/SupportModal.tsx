import React, { useState, useEffect } from 'react';
import {
  X,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  CheckCircle,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Inbox,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SupportTicket } from '../types/user';
import {
  fetchUserSupportMessages,
  fetchTicketReplies,
  submitSupportReply,
  SupportMessageRecord,
  SupportReplyRecord,
} from '../services/supportService';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const SupportModal: React.FC = () => {
  const { isSupportModalOpen, setIsSupportModalOpen, submitSupportTicket, user } = useAuth();
  const { language } = useLanguage();

  const [activeTab, setActiveTab] = useState<'new' | 'my_requests'>('new');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<SupportTicket['category']>('payment');
  const [message, setMessage] = useState('');
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);

  // My Requests State
  const [userTickets, setUserTickets] = useState<SupportMessageRecord[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [repliesMap, setRepliesMap] = useState<Record<string, SupportReplyRecord[]>>({});
  const [replyInput, setReplyInput] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  useEffect(() => {
    if (isSupportModalOpen && user?.id) {
      loadUserTickets();
    }
  }, [isSupportModalOpen, user?.id]);

  const loadUserTickets = async () => {
    if (!user?.id) return;
    setIsLoadingTickets(true);
    try {
      const tickets = await fetchUserSupportMessages(user.id);
      setUserTickets(tickets);
    } catch (err) {
      console.warn('Failed to load user support tickets:', err);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  // Realtime subscription for support_messages and support_replies
  useEffect(() => {
    if (!isSupportModalOpen || !user?.id || !isSupabaseConfigured()) return;

    const channel = supabase
      .channel(`support_user_${user.id}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_messages',
          filter: `user_id=eq.${user.id}`,
        },
        async () => {
          const tickets = await fetchUserSupportMessages(user.id);
          setUserTickets(tickets);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_replies',
        },
        async (payload: any) => {
          if (payload?.new?.ticket_id) {
            const ticketId = payload.new.ticket_id;
            const updatedReplies = await fetchTicketReplies(ticketId);
            setRepliesMap((prev) => ({ ...prev, [ticketId]: updatedReplies }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isSupportModalOpen, user?.id]);

  const handleToggleExpand = async (ticketId: string) => {
    if (expandedTicketId === ticketId) {
      setExpandedTicketId(null);
    } else {
      setExpandedTicketId(ticketId);
      if (!repliesMap[ticketId]) {
        const replies = await fetchTicketReplies(ticketId);
        setRepliesMap((prev) => ({ ...prev, [ticketId]: replies }));
      }
    }
  };

  const handleSendFollowUp = async (ticketId: string) => {
    if (!replyInput.trim() || !user) return;
    setIsSendingReply(true);
    try {
      const res = await submitSupportReply({
        ticketId,
        senderId: user.id,
        senderRole: 'user',
        senderName: user.name || 'User',
        message: replyInput.trim(),
      });

      if (res.success && res.data) {
        setRepliesMap((prev) => ({
          ...prev,
          [ticketId]: [...(prev[ticketId] || []), res.data!],
        }));
        setReplyInput('');
        loadUserTickets();
      }
    } finally {
      setIsSendingReply(false);
    }
  };

  if (!isSupportModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    submitSupportTicket(
      subject.trim() || 'জরুরী সাপোর্ট রিকোয়েস্ট',
      message,
      category
    );

    const ticketNumber = `TKT-${Math.floor(10000 + Math.random() * 90000)}`;
    setSubmittedTicketId(ticketNumber);
    setSubject('');
    setMessage('');
    loadUserTickets();
  };

  const whatsappText = encodeURIComponent(
    `হ্যালো চিত্রকথা অ্যাডমিন, আমার আইডি: ${user?.id || 'গেস্ট'}, নাম: ${user?.name || 'দর্শক'}। আমার সমস্যা: ${message || 'তাৎক্ষণিক সাহায্য প্রয়োজন'}`
  );
  const whatsappUrl = `https://wa.me/8801643442518?text=${whatsappText}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={() => setIsSupportModalOpen(false)} />

      <div className="relative z-10 w-full max-w-xl bg-[#0c0e16] border border-white/10 rounded-3xl shadow-2xl p-4 sm:p-7 space-y-5 overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-600 to-rose-700 flex items-center justify-center text-white shadow-lg shadow-rose-950/40">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-cinzel">
                {language === 'bn' ? 'অ্যাডমিন হেল্প ও সাপোর্ট' : 'ChitroKatha Support Center'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {language === 'bn'
                  ? 'আপনার যেকোনো সমস্যা অ্যাডমিনকে সরাসরি জানান ও সমাধান ট্র্যাক করুন'
                  : 'Submit queries and track ticket lifecycle in real-time'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSupportModalOpen(false)}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-black/40 border border-white/5 rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('new');
              setSubmittedTicketId(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'new'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {language === 'bn' ? 'নতুন বার্তা পাঠান' : 'New Request'}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('my_requests');
              loadUserTickets();
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'my_requests'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>{language === 'bn' ? 'আমার রিকোয়েস্টসমূহ' : 'My Requests'}</span>
            {userTickets.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 text-white font-mono font-bold">
                {userTickets.length}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: NEW REQUEST */}
        {activeTab === 'new' && (
          <>
            {submittedTicketId ? (
              <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">
                    {language === 'bn' ? 'বার্তা সফলভাবে পাঠানো হয়েছে!' : 'Message Sent Successfully!'}
                  </h3>
                  <p className="text-xs text-emerald-300 font-mono">
                    {language === 'bn' ? 'টিকিট আইডি' : 'Ticket ID'}: {submittedTicketId}
                  </p>
                  <p className="text-[11px] text-slate-400 pt-1">
                    {language === 'bn'
                      ? 'অ্যাডমিন টিম দ্রুত রিভিউ করে উত্তর প্রদান করবেন। "আমার রিকোয়েস্টসমূহ" ট্যাব থেকে স্ট্যাটাস দেখতে পারবেন।'
                      : 'Our admin team will review and reply. You can track status under "My Requests".'}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setSubmittedTicketId(null);
                      setActiveTab('my_requests');
                      loadUserTickets();
                    }}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    {language === 'bn' ? 'স্ট্যাটাস ট্র্যাক করুন' : 'Track Status'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* User info banner */}
                {user ? (
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between text-xs text-slate-400">
                    <div>
                      <span className="text-white font-medium">{user.name}</span>
                      <span className="mx-2 text-zinc-600">•</span>
                      <span className="text-zinc-400 font-mono">{user.email}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                      ID: #{user.id.slice(0, 6)}
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>
                      {language === 'bn'
                        ? 'সাপোর্ট টিকিট সেভ রাখতে অনুগ্রহ করে লগইন করুন।'
                        : 'Please login to track your support tickets across devices.'}
                    </span>
                  </div>
                )}

                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {language === 'bn' ? 'সমস্যার ধরণ (Category)' : 'Issue Category'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'payment', labelBn: 'পেমেন্ট / রিচার্জ', labelEn: 'Payment' },
                      { id: 'video', labelBn: 'ভিডিও / স্ট্রিমিং', labelEn: 'Streaming' },
                      { id: 'account', labelBn: 'অ্যাকাউন্ট / পাসওয়ার্ড', labelEn: 'Account' },
                      { id: 'other', labelBn: 'অন্যান্য জিজ্ঞাসা', labelEn: 'Other' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id as any)}
                        className={`p-2.5 rounded-xl border text-xs font-medium transition-all text-center ${
                          category === cat.id
                            ? 'bg-rose-600/20 border-rose-500 text-rose-300'
                            : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        {language === 'bn' ? cat.labelBn : cat.labelEn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {language === 'bn' ? 'বিষয় (Subject)' : 'Subject'}
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={language === 'bn' ? 'যেমন: বিকাশ পেমেন্ট যাচাই বা বাফারিং সমস্যা' : 'e.g. Payment inquiry or video playback issue'}
                    className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {language === 'bn' ? 'বিস্তারিত বর্ণনা (Message)' : 'Detailed Message'}
                  </label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    placeholder={
                      language === 'bn'
                        ? 'আপনার সমস্যার বিবরণ লিখুন (যেমন: পেমেন্ট TrxID, কোন ডিভাইসে সমস্যা ইত্যাদি)...'
                        : 'Describe your issue in detail (e.g. transaction ID, device info)...'
                    }
                    className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition-colors"
                  >
                    <span>হোয়াটসঅ্যাপ সাপোর্ট (Instant)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    type="submit"
                    disabled={!message.trim()}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-rose-950/40 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'বার্তা পাঠান' : 'Submit Ticket'}</span>
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* TAB 2: MY SUPPORT REQUESTS */}
        {activeTab === 'my_requests' && (
          <div className="space-y-3">
            {isLoadingTickets ? (
              <div className="p-8 text-center text-xs text-zinc-400">
                <span className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin inline-block mb-2" />
                <p>{language === 'bn' ? 'রিকোয়েস্ট লোড হচ্ছে...' : 'Loading support tickets...'}</p>
              </div>
            ) : userTickets.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-2">
                <Inbox className="w-8 h-8 text-zinc-500 mx-auto" />
                <h4 className="text-sm font-bold text-white">
                  {language === 'bn' ? 'কোনো সাপোর্ট রিকোয়েস্ট নেই' : 'No Support Requests Found'}
                </h4>
                <p className="text-xs text-zinc-400">
                  {language === 'bn'
                    ? 'আপনি এখনো কোনো সহায়তা বার্তা পাঠাননি। যেকোনো প্রশ্নে নতুন বার্তা পাঠান।'
                    : 'You have not submitted any support tickets yet.'}
                </p>
                <button
                  onClick={() => setActiveTab('new')}
                  className="mt-2 px-4 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-500 transition-colors"
                >
                  {language === 'bn' ? 'নতুন বার্তা পাঠান' : 'Create Ticket'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {userTickets.map((ticket) => {
                  const isExpanded = expandedTicketId === ticket.id;
                  const replies = repliesMap[ticket.id] || [];

                  return (
                    <div
                      key={ticket.id}
                      className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden transition-all"
                    >
                      {/* Ticket Header Card */}
                      <div
                        onClick={() => handleToggleExpand(ticket.id)}
                        className="p-4 flex items-start justify-between gap-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 text-zinc-400 border border-white/5">
                              #{ticket.id.slice(0, 8)}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 font-semibold uppercase">
                              {ticket.category}
                            </span>
                            {/* Status Badge */}
                            {ticket.status === 'resolved' ? (
                              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                <span>Resolved</span>
                              </span>
                            ) : ticket.status === 'in_progress' ? (
                              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>In Progress</span>
                              </span>
                            ) : (
                              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                <span>New</span>
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-white truncate pt-0.5">
                            {ticket.subject}
                          </h4>
                          <p className="text-[11px] text-zinc-400 truncate">
                            {ticket.message}
                          </p>
                          <div className="text-[10px] text-zinc-500 flex items-center gap-3 pt-0.5">
                            <span>
                              {language === 'bn' ? 'জমাদান' : 'Created'}: {new Date(ticket.createdAt).toLocaleDateString('bn-BD')}
                            </span>
                            {ticket.updatedAt && (
                              <span>
                                {language === 'bn' ? 'আপডেট' : 'Updated'}: {new Date(ticket.updatedAt).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="p-1 rounded-lg bg-white/5 text-zinc-400 shrink-0">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>

                      {/* Expanded Ticket Details & Reply Thread */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-3 bg-black/60">
                          {/* Visual Lifecycle Timeline: Submitted -> In Progress -> Resolved */}
                          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-2">
                              {language === 'bn' ? 'টিকিট লাইফসাইকেল টাইমলাইন' : 'Ticket Lifecycle Timeline'}
                            </span>
                            <div className="flex items-center justify-between relative px-2">
                              {/* Step 1: Submitted / New */}
                              <div className="flex flex-col items-center text-center z-10 w-24">
                                <div className="w-6 h-6 rounded-full bg-amber-500/20 border-2 border-amber-500 text-amber-400 flex items-center justify-center text-[10px] font-bold">
                                  ✓
                                </div>
                                <span className="text-[11px] font-bold text-white mt-1">
                                  {language === 'bn' ? 'জমাদান' : 'Submitted'}
                                </span>
                                <span className="text-[9px] text-zinc-400 font-mono">
                                  {new Date(ticket.createdAt).toLocaleDateString('bn-BD', { month: 'short', day: 'numeric' })}
                                </span>
                              </div>

                              {/* Progress Line 1 */}
                              <div
                                className={`flex-1 h-0.5 -mt-6 transition-all ${
                                  ticket.status === 'in_progress' || ticket.status === 'resolved'
                                    ? 'bg-gradient-to-r from-amber-500 to-blue-500'
                                    : 'bg-white/10'
                                }`}
                              />

                              {/* Step 2: In Progress */}
                              <div className="flex flex-col items-center text-center z-10 w-28">
                                <div
                                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all ${
                                    ticket.status === 'in_progress'
                                      ? 'bg-blue-500/20 border-blue-500 text-blue-400 animate-pulse'
                                      : ticket.status === 'resolved'
                                      ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                                      : 'bg-zinc-800 border-zinc-600 text-zinc-500'
                                  }`}
                                >
                                  {ticket.status === 'resolved' || ticket.status === 'in_progress' ? '✓' : '2'}
                                </div>
                                <span
                                  className={`text-[11px] font-bold mt-1 ${
                                    ticket.status === 'in_progress'
                                      ? 'text-blue-400'
                                      : ticket.status === 'resolved'
                                      ? 'text-white'
                                      : 'text-zinc-500'
                                  }`}
                                >
                                  {language === 'bn' ? 'পর্যালোচনাধীন' : 'In Progress'}
                                </span>
                                <span className="text-[9px] text-zinc-400 font-mono">
                                  {ticket.inProgressAt
                                    ? new Date(ticket.inProgressAt).toLocaleDateString('bn-BD', { month: 'short', day: 'numeric' })
                                    : ticket.status !== 'new' && ticket.updatedAt
                                    ? new Date(ticket.updatedAt).toLocaleDateString('bn-BD', { month: 'short', day: 'numeric' })
                                    : '—'}
                                </span>
                              </div>

                              {/* Progress Line 2 */}
                              <div
                                className={`flex-1 h-0.5 -mt-6 transition-all ${
                                  ticket.status === 'resolved'
                                    ? 'bg-gradient-to-r from-blue-500 to-emerald-500'
                                    : 'bg-white/10'
                                }`}
                              />

                              {/* Step 3: Resolved */}
                              <div className="flex flex-col items-center text-center z-10 w-24">
                                <div
                                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all ${
                                    ticket.status === 'resolved'
                                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                      : 'bg-zinc-800 border-zinc-600 text-zinc-500'
                                  }`}
                                >
                                  {ticket.status === 'resolved' ? '✓' : '3'}
                                </div>
                                <span
                                  className={`text-[11px] font-bold mt-1 ${
                                    ticket.status === 'resolved' ? 'text-emerald-400' : 'text-zinc-500'
                                  }`}
                                >
                                  {language === 'bn' ? 'সমাধান সম্পন্ন' : 'Resolved'}
                                </span>
                                <span className="text-[9px] text-zinc-400 font-mono">
                                  {ticket.resolvedAt
                                    ? new Date(ticket.resolvedAt).toLocaleDateString('bn-BD', { month: 'short', day: 'numeric' })
                                    : '—'}
                                </span>
                              </div>
                            </div>
                          </div>
                          {/* Original Message */}
                          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-zinc-300">
                            <span className="text-[10px] text-zinc-500 block mb-1">
                              {language === 'bn' ? 'আপনার মূল বার্তা:' : 'Your message:'}
                            </span>
                            <p className="whitespace-pre-wrap">{ticket.message}</p>
                          </div>

                          {/* Admin Official Notes / Response */}
                          {ticket.adminNotes && (
                            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                              <span className="text-[10px] text-amber-400 font-bold block mb-1 uppercase tracking-wider">
                                ★ {language === 'bn' ? 'অ্যাডমিন টিমের উত্তর (Admin Response):' : 'Official Admin Response:'}
                              </span>
                              <p className="whitespace-pre-wrap font-medium">{ticket.adminNotes}</p>
                            </div>
                          )}

                          {/* Thread Replies */}
                          {replies.length > 0 && (
                            <div className="space-y-2 pt-1">
                              <span className="text-[10px] text-zinc-500 uppercase font-semibold">
                                {language === 'bn' ? 'কথোপকথন (Conversation History):' : 'Conversation History:'}
                              </span>
                              {replies.map((r) => (
                                <div
                                  key={r.id}
                                  className={`p-2.5 rounded-xl text-xs max-w-[85%] ${
                                    r.senderRole === 'admin'
                                      ? 'bg-rose-950/40 border border-rose-500/30 text-rose-200 mr-auto'
                                      : 'bg-white/10 text-white ml-auto text-right'
                                  }`}
                                >
                                  <div className="text-[10px] text-zinc-400 font-bold mb-0.5">
                                    {r.senderName} ({r.senderRole === 'admin' ? 'Support Desk' : 'You'})
                                  </div>
                                  <p className="whitespace-pre-wrap text-left">{r.message}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* User Follow-up Input if not resolved */}
                          {ticket.status !== 'resolved' ? (
                            <div className="pt-2 flex items-center gap-2">
                              <input
                                type="text"
                                value={replyInput}
                                onChange={(e) => setReplyInput(e.target.value)}
                                placeholder={language === 'bn' ? 'ফলো-আপ মেসেজ লিখুন...' : 'Write a follow-up reply...'}
                                className="flex-1 px-3 py-2 bg-black/80 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                              />
                              <button
                                type="button"
                                disabled={!replyInput.trim() || isSendingReply}
                                onClick={() => handleSendFollowUp(ticket.id)}
                                className="px-3 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>{isSendingReply ? '...' : language === 'bn' ? 'উত্তর দিন' : 'Reply'}</span>
                              </button>
                            </div>
                          ) : (
                            <p className="text-[10px] text-emerald-400 font-medium text-center pt-1">
                              ✓ {language === 'bn' ? 'এই টিকিটটির সমাধান সম্পন্ন হয়েছে।' : 'This support ticket has been resolved.'}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
