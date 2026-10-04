import React, { useState } from 'react';
import { Tag, Plus, Edit2, Trash2 } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { AdminStatusBadge } from '../common/AdminStatusBadge';
import { AddCouponModal } from '../modals/AddCouponModal';

export const CouponsView: React.FC = () => {
  const { coupons } = useAdmin();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-['Cinzel',serif]">
            Promo Coupons & Discounts
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Create promotional discount codes for festival campaigns and referral rewards.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-lg shadow-rose-600/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon</span>
        </button>
      </div>

      {/* Coupons Table */}
      <div className="bg-[#0e1219]/90 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/30 border-b border-white/5 text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5 font-medium">Coupon Code</th>
                <th className="px-5 py-3.5 font-medium">Discount</th>
                <th className="px-5 py-3.5 font-medium">Type</th>
                <th className="px-5 py-3.5 font-medium">Usage Limit</th>
                <th className="px-5 py-3.5 font-medium">Claimed / Used</th>
                <th className="px-5 py-3.5 font-medium">Validity Period</th>
                <th className="px-5 py-3.5 font-medium">Status</th>
                <th className="px-5 py-3.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="font-mono font-bold text-xs text-white bg-black/40 border border-white/10 px-2.5 py-1 rounded-lg">
                      {coupon.code}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-bold text-emerald-400 font-mono">
                    {coupon.discount}
                  </td>
                  <td className="px-5 py-3.5 capitalize text-zinc-300">
                    {coupon.discountType}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-zinc-400">
                    {coupon.usageLimit} users
                  </td>
                  <td className="px-5 py-3.5 font-mono text-zinc-300">
                    <span className="font-bold text-white">{coupon.usedCount}</span> /{' '}
                    {coupon.usageLimit}
                  </td>
                  <td className="px-5 py-3.5 text-zinc-400 font-mono text-[11px]">
                    {coupon.startDate} ~ {coupon.endDate}
                  </td>
                  <td className="px-5 py-3.5">
                    <AdminStatusBadge status={coupon.status} type="coupon" />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => alert(`Edit coupon ${coupon.code}`)}
                        className="p-1.5 text-zinc-400 hover:text-white"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => alert(`Delete coupon ${coupon.code}`)}
                        className="p-1.5 text-zinc-400 hover:text-rose-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AddCouponModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
};
