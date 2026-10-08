import React, { useState } from 'react';
import {
  CreditCard,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { AdminStatusBadge } from '../common/AdminStatusBadge';
import { AdminUserAvatar } from '../common/AdminUserAvatar';
import { AdminFilterBar } from '../common/AdminFilterBar';
import { AdminEmptyState } from '../common/AdminEmptyState';
import { PaymentDetailModal } from '../modals/PaymentDetailModal';
import { PaymentStatus } from '../../types/adminTypes';
import { AdminPagination } from '../common/AdminPagination';

export const PaymentsView: React.FC = () => {
  const {
    payments,
    setSelectedPayment,
    updatePaymentStatus,
    isLoadingData,
    paymentsError,
    refreshPayments
  } = useAdmin();
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const pendingCount = payments.filter((p) => p.status === 'pending').length;
  const approvedCount = payments.filter((p) => p.status === 'approved').length;
  const rejectedCount = payments.filter((p) => p.status === 'rejected').length;

  const filtered = payments.filter((p) => {
    const matchesTab = activeTab === 'all' || p.status === activeTab;
    const matchesSearch =
      p.trxId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.senderPhone.includes(searchTerm) ||
      p.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = methodFilter === 'all' || p.method === methodFilter;
    return matchesTab && matchesSearch && matchesMethod;
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
            Payment Verification & Transactions
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Verify manual bKash, Nagad, Rocket and Upay transaction IDs submitted by subscribers.
          </p>
        </div>

        {/* Status Count Pills */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold">
            {paymentsError ? '—' : `${pendingCount} Pending`}
          </span>
          <span className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
            {paymentsError ? '—' : `${approvedCount} Approved`}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-[#0e1219] border border-white/5 rounded-2xl">
        <button
          onClick={() => {
            setActiveTab('pending');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'pending'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Verifications</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 font-bold">
            {pendingCount}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('approved');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'approved'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Approved</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-bold">
            {approvedCount}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('rejected');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'rejected'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Rejected</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-bold">
            {rejectedCount}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('all');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'all'
              ? 'bg-white/10 text-white'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span>All Transactions ({paymentsError ? '—' : payments.length})</span>
        </button>
      </div>

      {/* Filter Bar */}
      <AdminFilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search Trx ID, phone number or user name..."
        filters={[
          {
            name: 'Method',
            selectedValue: methodFilter,
            onChange: setMethodFilter,
            options: [
              { label: 'All Methods', value: 'all' },
              { label: 'bKash', value: 'bkash' },
              { label: 'Nagad', value: 'nagad' },
              { label: 'Rocket', value: 'rocket' },
              { label: 'Upay', value: 'upay' }
            ]
          }
        ]}
      />

      {/* Table, Loading, Error, or Empty State */}
      {isLoadingData ? (
        <div className="p-12 text-center text-zinc-400 text-xs">
          <span className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin inline-block mb-2" />
          <p>Loading payment verifications from database...</p>
        </div>
      ) : paymentsError ? (
        <div className="p-8 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-950/50">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-bold text-white font-['Cinzel',serif]">
              Unable to Load Payments (পেমেন্ট লেনদেন লোড করা সম্ভব হয়নি)
            </h3>
            <p className="text-xs text-rose-300 font-medium">
              {paymentsError}
            </p>
            <p className="text-[11px] text-zinc-400">
              Unable to verify administrative authorization for payment records. Please try again.
            </p>
          </div>
          <button
            onClick={() => refreshPayments()}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-950/40 inline-flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Loading Payments</span>
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <AdminEmptyState
          icon={<CreditCard className="w-10 h-10 text-zinc-600" />}
          title={payments.length === 0 ? "No Payment Requests Yet" : "No Matching Transactions"}
          description={
            payments.length === 0
              ? "Subscriber bKash/Nagad/Rocket/Upay payment submissions will appear here for verification."
              : "No payment records match your active search or filter criteria."
          }
        />
      ) : (
        <div className="bg-[#0e1219]/90 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/30 border-b border-white/5 text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Transaction ID</th>
                  <th className="px-5 py-3.5 font-medium">Subscriber</th>
                  <th className="px-5 py-3.5 font-medium">Plan</th>
                  <th className="px-5 py-3.5 font-medium">Amount</th>
                  <th className="px-5 py-3.5 font-medium">Method & Sender</th>
                  <th className="px-5 py-3.5 font-medium">Date</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginated.map((payment) => (
                  <tr
                    key={payment.id}
                    className={`transition-colors ${
                      payment.status === 'pending'
                        ? 'bg-amber-500/[0.05] hover:bg-amber-500/[0.08] ring-1 ring-amber-500/10'
                        : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <td className="px-5 py-3.5 font-mono font-bold text-rose-400">
                      <div className="flex items-center gap-1.5">
                        {payment.status === 'pending' && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
                        )}
                        <span>{payment.trxId}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <AdminUserAvatar
                          name={payment.userName}
                          avatarUrl={payment.userAvatar}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate">{payment.userName}</div>
                          <div className="text-[10px] text-zinc-400 truncate">{payment.userEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-300 font-medium">
                      <span className="px-2 py-0.5 rounded-md bg-white/5 font-mono text-[11px] font-semibold text-amber-300">
                        {payment.planName}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold font-mono text-emerald-400 text-sm">
                      ৳{payment.amount}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-zinc-300">
                      <span className="capitalize font-bold text-white">{payment.method}</span>
                      <span className="block text-[10px] text-zinc-400">{payment.senderPhone}</span>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-400">{payment.date}</td>
                    <td className="px-5 py-3.5">
                      <AdminStatusBadge status={payment.status} type="payment" />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedPayment(payment)}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          Inspect
                        </button>
                        {payment.status === 'pending' && (
                          <>
                            <button
                              onClick={() => {
                                if (window.confirm(`Approve payment ${payment.trxId} (৳${payment.amount}) for ${payment.userName}? This will activate their subscription immediately.`)) {
                                  updatePaymentStatus(payment.id, 'approved');
                                }
                              }}
                              title="Approve and activate subscription"
                              className="px-2.5 py-1 text-xs font-bold text-black bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-all flex items-center gap-1 shadow-md shadow-emerald-950/40 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Reject payment ${payment.trxId} for ${payment.userName}?`)) {
                                  updatePaymentStatus(payment.id, 'rejected');
                                }
                              }}
                              title="Reject payment request"
                              className="px-2 py-1 text-xs font-semibold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}
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
      )}

      <PaymentDetailModal />
    </div>
  );
};
