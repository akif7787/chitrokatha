import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { AdminModal } from '../common/AdminModal';
import { AdminCoupon } from '../../types/adminTypes';
import { Tag, Plus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface AddCouponModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddCouponModal: React.FC<AddCouponModalProps> = ({ isOpen, onClose }) => {
  const { addCoupon } = useAdmin();

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('25');
  const [usageLimit, setUsageLimit] = useState('500');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 2);
    return d.toISOString().split('T')[0];
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMsg('Coupon code is required.');
      return;
    }

    const val = parseFloat(discountValue);
    if (isNaN(val) || val <= 0) {
      setErrorMsg('Discount value must be greater than 0.');
      return;
    }

    if (discountType === 'percentage' && val > 100) {
      setErrorMsg('Percentage discount cannot exceed 100%.');
      return;
    }

    const limit = parseInt(usageLimit) || 100;
    const newCoupon: AdminCoupon = {
      id: `cpn-${Date.now()}`,
      code: cleanCode,
      discount: discountType === 'percentage' ? `${val}% OFF` : `৳${val} Flat`,
      discountType,
      discountValue: val,
      usageLimit: limit,
      usedCount: 0,
      startDate,
      endDate,
      status: 'active'
    };

    setIsSubmitting(true);
    try {
      const res = await addCoupon(newCoupon);
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to save coupon to database.');
      } else {
        setSuccessMsg(`Coupon "${cleanCode}" created successfully!`);
        setTimeout(() => {
          onClose();
          setSuccessMsg(null);
          setCode('');
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred while saving the coupon.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Promo Coupon"
      subtitle="Issue discounts for VIP subscribers in Supabase"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Coupon Code *</label>
          <input
            type="text"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. FESTIVAL2026"
            className="w-full px-3.5 py-2 font-mono uppercase bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Discount Type</label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
              className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (৳)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              {discountType === 'percentage' ? 'Percentage (% Off)' : 'Amount (৳ Off)'}
            </label>
            <input
              type="number"
              required
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Usage Limit</label>
          <input
            type="number"
            value={usageLimit}
            onChange={(e) => setUsageLimit(e.target.value)}
            className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50"
            />
          </div>
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
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-lg shadow-rose-600/20"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>{isSubmitting ? 'Creating...' : 'Create Coupon'}</span>
          </button>
        </div>
      </form>
    </AdminModal>
  );
};
