import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { AdminModal } from '../common/AdminModal';
import { AdminStatusBadge } from '../common/AdminStatusBadge';
import { AdminUserAvatar } from '../common/AdminUserAvatar';
import { CheckCircle2, XCircle, Phone, Calendar, CreditCard, Hash, User, ShieldCheck } from 'lucide-react';

export const PaymentDetailModal: React.FC = () => {
  const { selectedPayment, setSelectedPayment, updatePaymentStatus } = useAdmin();
  const [noteInput, setNoteInput] = useState('');

  if (!selectedPayment) return null;

  const handleApprove = () => {
    updatePaymentStatus(selectedPayment.id, 'approved', noteInput || 'Payment verified by admin');
    setSelectedPayment(null);
  };

  const handleReject = () => {
    updatePaymentStatus(selectedPayment.id, 'rejected', noteInput || 'Rejected by admin');
    setSelectedPayment(null);
  };

  return (
    <AdminModal
      isOpen={!!selectedPayment}
      onClose={() => setSelectedPayment(null)}
      title="Payment Verification"
      subtitle={`Transaction #${selectedPayment.trxId}`}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* User Card */}
        <div className="flex items-center gap-3.5 p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <AdminUserAvatar
            name={selectedPayment.userName}
            avatarUrl={selectedPayment.userAvatar}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-white truncate">{selectedPayment.userName}</h4>
            <p className="text-xs text-zinc-400 truncate">{selectedPayment.userEmail}</p>
          </div>
          <AdminStatusBadge status={selectedPayment.status} type="payment" />
        </div>

        {/* Payment Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-rose-400" />
              Method & Plan
            </span>
            <p className="font-semibold text-white capitalize">
              {selectedPayment.method} • {selectedPayment.planName}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-amber-400" />
              Amount Paid
            </span>
            <p className="font-bold text-lg text-emerald-400">৳{selectedPayment.amount}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-blue-400" />
              Sender Number
            </span>
            <p className="font-mono text-zinc-200">{selectedPayment.senderPhone}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              Submitted At
            </span>
            <p className="text-zinc-200">{selectedPayment.date}</p>
          </div>
        </div>

        {/* Transaction ID Display */}
        <div className="p-3.5 rounded-xl bg-[#090b10] border border-white/10 flex items-center justify-between">
          <span className="text-xs text-zinc-400">Transaction ID:</span>
          <span className="font-mono font-bold text-rose-400 tracking-wider text-sm">
            {selectedPayment.trxId}
          </span>
        </div>

        {/* Verification Note input */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Admin Note / Reason (Optional)
          </label>
          <input
            type="text"
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder={selectedPayment.notes || 'e.g. Verified with bKash Merchant SMS'}
            className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500/50"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/5">
          <button
            onClick={() => setSelectedPayment(null)}
            className="px-4 py-2.5 text-xs font-medium text-zinc-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleReject}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 rounded-xl transition-all"
          >
            <XCircle className="w-4 h-4" />
            <span>Reject Payment</span>
          </button>

          <button
            onClick={handleApprove}
            className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-lg shadow-emerald-600/20"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approve Payment</span>
          </button>
        </div>
      </div>
    </AdminModal>
  );
};
