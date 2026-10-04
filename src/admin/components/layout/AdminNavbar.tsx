import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Bell,
  Search,
  ChevronDown,
  User,
  Settings,
  LogOut,
  ExternalLink,
  Shield,
  CreditCard,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { AdminUserAvatar } from '../common/AdminUserAvatar';
import { mockNotificationsDropdown } from '../../data/adminMockData';

export const AdminNavbar: React.FC = () => {
  const {
    currentRoute,
    toggleSidebar,
    isSidebarCollapsed,
    currentAdmin,
    searchQuery,
    setSearchQuery,
    navigate
  } = useAdmin();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const adminRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (adminRef.current && !adminRef.current.contains(e.target as Node)) {
        setIsAdminDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = () => {
    switch (currentRoute) {
      case '/admin':
        return { title: 'Dashboard', category: 'Overview' };
      case '/admin/movies':
        return { title: 'Movies Management', category: 'Content' };
      case '/admin/drama':
        return { title: 'Drama & Natok', category: 'Content' };
      case '/admin/web-series':
        return { title: 'Web Series', category: 'Content' };
      case '/admin/actors':
        return { title: 'Actors & Star Cast', category: 'Content' };
      case '/admin/genres':
        return { title: 'Genres Catalog', category: 'Content' };
      case '/admin/users':
        return { title: 'User Management', category: 'Users' };
      case '/admin/subscriptions':
        return { title: 'Subscription Plans', category: 'Subscriptions' };
      case '/admin/payments':
        return { title: 'Payment Verification', category: 'Finance' };
      case '/admin/ads':
        return { title: 'Advertisement Campaigns', category: 'Marketing' };
      case '/admin/notifications':
        return { title: 'Broadcast Notifications', category: 'Marketing' };
      case '/admin/coupons':
        return { title: 'Coupons & Promos', category: 'Subscriptions' };
      case '/admin/analytics':
        return { title: 'Analytics & Insights', category: 'Analytics' };
      case '/admin/settings':
        return { title: 'Platform Settings', category: 'System' };
      case '/admin/admins':
        return { title: 'Admin Team & Roles', category: 'System' };
      default:
        return { title: 'Admin Console', category: 'Admin' };
    }
  };

  const { title, category } = getPageTitle();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 bg-[#090b10]/80 backdrop-blur-xl border-b border-white/5 transition-all">
      {/* Left: Sidebar Toggle + Title/Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          aria-label="Toggle Navigation Sidebar"
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex flex-col">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <span>{category}</span>
            <span>/</span>
            <span className="text-rose-400 font-medium">{title}</span>
          </div>
          <h1 className="text-sm font-bold text-white tracking-wide">{title}</h1>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="hidden md:flex items-center flex-1 max-w-xs mx-6">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Quick search across admin..."
            className="w-full pl-9 pr-4 py-1.5 bg-white/[0.03] border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500/50 transition-all"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Quick Link to User Streaming Site */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            window.history.pushState(null, '', '/');
            window.location.href = '/';
          }}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-white/[0.03] hover:bg-white/5 border border-white/5 rounded-xl transition-all"
        >
          <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
          <span>Live Site</span>
        </a>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Admin Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#090b10] animate-pulse" />
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-[#0e1219] border border-white/10 rounded-2xl shadow-2xl shadow-black/90 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-white">Admin Alerts</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-500/20 text-rose-400 rounded-full border border-rose-500/30">
                    3 New
                  </span>
                </div>
                <button
                  onClick={() => setIsNotifOpen(false)}
                  className="text-[11px] text-zinc-400 hover:text-white transition-colors"
                >
                  Mark all read
                </button>
              </div>

              <div className="divide-y divide-white/5 my-2">
                {mockNotificationsDropdown.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      setIsNotifOpen(false);
                      if (n.type === 'payment') navigate('/admin/payments');
                      else if (n.type === 'user') navigate('/admin/users');
                    }}
                    className="py-2.5 px-1 hover:bg-white/[0.03] rounded-xl transition-colors cursor-pointer flex gap-3"
                  >
                    <div className="p-2 rounded-xl bg-white/[0.04] text-rose-400 shrink-0 self-start">
                      {n.type === 'payment' ? (
                        <CreditCard className="w-4 h-4 text-emerald-400" />
                      ) : n.type === 'user' ? (
                        <UserCheck className="w-4 h-4 text-blue-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{n.title}</p>
                      <p className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5 leading-snug">
                        {n.description}
                      </p>
                      <span className="text-[10px] text-zinc-500 mt-1 block font-mono">
                        {n.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  setIsNotifOpen(false);
                  navigate('/admin/notifications');
                }}
                className="w-full mt-2 py-2 text-center text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all"
              >
                View all broadcast logs →
              </button>
            </div>
          )}
        </div>

        {/* Admin Profile Dropdown */}
        <div className="relative" ref={adminRef}>
          <button
            onClick={() => setIsAdminDropdownOpen(!isAdminDropdownOpen)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-white/5 transition-colors"
          >
            <AdminUserAvatar
              name={currentAdmin.name}
              avatarUrl={currentAdmin.avatar}
              size="sm"
            />
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-white leading-tight">
                {currentAdmin.name}
              </span>
              <span className="text-[10px] text-zinc-400">{currentAdmin.roleTitle}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
          </button>

          {isAdminDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-[#0e1219] border border-white/10 rounded-2xl shadow-2xl shadow-black/90 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3 border-b border-white/5 mb-1">
                <p className="text-xs font-bold text-white">{currentAdmin.name}</p>
                <p className="text-[10px] text-zinc-400 truncate">{currentAdmin.email}</p>
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold">
                  <Shield className="w-3 h-3" />
                  <span>{currentAdmin.roleTitle}</span>
                </div>
              </div>

              <div className="space-y-0.5">
                <button
                  onClick={() => {
                    setIsAdminDropdownOpen(false);
                    navigate('/admin/admins');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                >
                  <User className="w-4 h-4 text-zinc-400" />
                  <span>Admin Profile</span>
                </button>
                <button
                  onClick={() => {
                    setIsAdminDropdownOpen(false);
                    navigate('/admin/settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                >
                  <Settings className="w-4 h-4 text-zinc-400" />
                  <span>Platform Settings</span>
                </button>
                <button
                  onClick={() => {
                    window.history.pushState(null, '', '/');
                    window.location.href = '/';
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Exit to Public Site</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
