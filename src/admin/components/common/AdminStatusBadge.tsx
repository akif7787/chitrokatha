import React from 'react';

interface AdminStatusBadgeProps {
  status: string;
  type?: 'payment' | 'user' | 'content' | 'ad' | 'coupon' | 'tier';
  size?: 'sm' | 'md';
}

export const AdminStatusBadge: React.FC<AdminStatusBadgeProps> = ({
  status,
  type = 'payment',
  size = 'sm'
}) => {
  const normalized = status.toLowerCase();

  const getStyle = () => {
    switch (normalized) {
      case 'approved':
      case 'active':
      case 'published':
      case 'sent':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'pending':
      case 'scheduled':
      case 'draft':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'rejected':
      case 'suspended':
      case 'expired':
      case 'disabled':
      case 'archived':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'vip':
        return 'bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-amber-300 border-amber-500/30';
      case 'standard':
      case 'basic':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'free':
        return 'bg-zinc-800 text-zinc-400 border-zinc-700/50';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700/50';
    }
  };

  const getDotColor = () => {
    switch (normalized) {
      case 'approved':
      case 'active':
      case 'published':
      case 'sent':
        return 'bg-emerald-400';
      case 'pending':
      case 'scheduled':
      case 'draft':
        return 'bg-amber-400 animate-pulse';
      case 'rejected':
      case 'suspended':
      case 'expired':
      case 'disabled':
      case 'archived':
        return 'bg-rose-400';
      case 'vip':
        return 'bg-amber-400';
      default:
        return 'bg-zinc-400';
    }
  };

  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${getStyle()} ${sizeClasses} backdrop-blur-sm transition-all`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${getDotColor()}`} />
      <span className="capitalize">{status}</span>
    </span>
  );
};
