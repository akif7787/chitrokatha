import React from 'react';
import { Film } from 'lucide-react';

interface AdminEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const AdminEmptyState: React.FC<AdminEmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-[#0e1219]/50 border border-white/5 rounded-2xl">
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-zinc-400 mb-4">
        {icon || <Film className="w-8 h-8 text-rose-500" />}
      </div>
      <h4 className="text-base font-semibold text-white">{title}</h4>
      <p className="text-xs text-zinc-400 max-w-sm mt-1 mb-6 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-lg shadow-rose-600/20"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
