import React, { useState } from 'react';

interface AdminUserAvatarProps {
  name: string;
  avatarUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showOnline?: boolean;
}

export const AdminUserAvatar: React.FC<AdminUserAvatarProps> = ({
  name,
  avatarUrl,
  size = 'md',
  showOnline = false
}) => {
  const [imageError, setImageError] = useState(false);

  const getInitials = (str: string) => {
    return str
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  }[size];

  return (
    <div className="relative inline-block shrink-0">
      {avatarUrl && !imageError ? (
        <img
          src={avatarUrl}
          alt={name}
          onError={() => setImageError(true)}
          className={`${sizeClasses} rounded-full object-cover ring-1 ring-white/10`}
        />
      ) : (
        <div
          className={`${sizeClasses} rounded-full bg-gradient-to-tr from-rose-600 to-amber-600 flex items-center justify-center font-semibold text-white ring-1 ring-white/10`}
        >
          {getInitials(name || 'Admin')}
        </div>
      )}
      {showOnline && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0e1219]" />
      )}
    </div>
  );
};
