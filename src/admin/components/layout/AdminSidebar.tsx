import React from 'react';
import {
  LayoutDashboard,
  Film,
  Tv,
  Clapperboard,
  Users,
  CreditCard,
  Tag,
  Megaphone,
  Bell,
  BarChart3,
  Settings,
  ShieldCheck,
  LogOut,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Layers,
  Award,
  DollarSign,
  MessageSquare,
  ShieldAlert
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { AdminRoute } from '../../types/adminTypes';
import { AdminUserAvatar } from '../common/AdminUserAvatar';

export const AdminSidebar: React.FC = () => {
  const {
    currentRoute,
    navigate,
    isSidebarOpen,
    setIsSidebarOpen,
    isSidebarCollapsed,
    currentAdmin,
    payments
  } = useAdmin();

  const pendingPaymentsCount = payments.filter((p) => p.status === 'pending').length;

  interface NavItem {
    label: string;
    route: AdminRoute;
    icon: React.ReactNode;
    badge?: string | number;
    badgeColor?: string;
  }

  interface NavSection {
    title: string;
    items: NavItem[];
  }

  const sections: NavSection[] = [
    {
      title: 'OVERVIEW',
      items: [
        { label: 'Dashboard', route: '/admin', icon: <LayoutDashboard className="w-4 h-4" /> }
      ]
    },
    {
      title: 'CONTENT',
      items: [
        { label: 'Movies', route: '/admin/movies', icon: <Film className="w-4 h-4" /> },
        { label: 'Drama', route: '/admin/drama', icon: <Tv className="w-4 h-4" /> },
        { label: 'Web Series', route: '/admin/web-series', icon: <Clapperboard className="w-4 h-4" /> },
        { label: 'Actors', route: '/admin/actors', icon: <Award className="w-4 h-4" /> },
        { label: 'Genres', route: '/admin/genres', icon: <Layers className="w-4 h-4" /> }
      ]
    },
    {
      title: 'USERS',
      items: [
        { label: 'All Users', route: '/admin/users', icon: <Users className="w-4 h-4" /> }
      ]
    },
    {
      title: 'SUBSCRIPTIONS',
      items: [
        { label: 'Subscription Plans', route: '/admin/subscriptions', icon: <Sparkles className="w-4 h-4" /> },
        { label: 'Coupons', route: '/admin/coupons', icon: <Tag className="w-4 h-4" /> }
      ]
    },
    {
      title: 'PAYMENTS',
      items: [
        {
          label: 'Payments & Trx',
          route: '/admin/payments',
          icon: <CreditCard className="w-4 h-4" />,
          badge: pendingPaymentsCount > 0 ? pendingPaymentsCount : undefined,
          badgeColor: 'bg-amber-500 text-black'
        }
      ]
    },
    {
      title: 'COMMUNICATION & SUPPORT',
      items: [
        { label: 'Support Messages', route: '/admin/support', icon: <MessageSquare className="w-4 h-4" /> },
        { label: 'Notifications', route: '/admin/notifications', icon: <Bell className="w-4 h-4" /> }
      ]
    },
    {
      title: 'MARKETING',
      items: [
        { label: 'Advertisements', route: '/admin/ads', icon: <Megaphone className="w-4 h-4" /> }
      ]
    },
    {
      title: 'ANALYTICS',
      items: [
        { label: 'Analytics & Revenue', route: '/admin/analytics', icon: <BarChart3 className="w-4 h-4" /> }
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { label: 'Settings', route: '/admin/settings', icon: <Settings className="w-4 h-4" /> },
        { label: 'Admin Management', route: '/admin/admins', icon: <ShieldCheck className="w-4 h-4" /> },
        { label: 'Audit Trail', route: '/admin/audit-logs', icon: <ShieldAlert className="w-4 h-4" /> }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-[#080b11] border-r border-white/5 transition-all duration-300 ease-in-out
        ${isSidebarCollapsed ? 'w-20' : 'w-64'}
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-600/30 shrink-0">
            <Film className="w-5 h-5 text-white" />
          </div>
          {!isSidebarCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-['Cinzel',serif] text-base font-bold tracking-wider text-white truncate">
                ChitroKatha
              </span>
              <span className="text-[10px] uppercase tracking-widest text-rose-400 font-semibold">
                Admin Panel
              </span>
            </div>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
          {sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {!isSidebarCollapsed && (
                <div className="px-3 text-[10px] font-bold tracking-wider text-zinc-400 uppercase mb-2">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const isActive = currentRoute === item.route;
                return (
                  <button
                    key={item.route}
                    onClick={() => navigate(item.route)}
                    title={isSidebarCollapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                      isActive
                        ? 'bg-gradient-to-r from-rose-600/20 to-rose-600/5 text-rose-400 border border-rose-500/20 font-semibold'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                    } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                  >
                    <span
                      className={`transition-colors ${
                        isActive ? 'text-rose-400' : 'text-zinc-400 group-hover:text-white'
                      }`}
                    >
                      {item.icon}
                    </span>
                    {!isSidebarCollapsed && (
                      <span className="truncate flex-1 text-left">{item.label}</span>
                    )}
                    {!isSidebarCollapsed && item.badge && (
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                          item.badgeColor || 'bg-rose-500 text-white'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {/* Quick link to User Website */}
          <div className="pt-2 border-t border-white/5">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState(null, '', '/');
                window.location.href = '/';
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-all ${
                isSidebarCollapsed ? 'justify-center' : ''
              }`}
              title="Return to User Streaming Site"
            >
              <ExternalLink className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>View Public Site</span>}
            </a>
          </div>
        </div>

        {/* Bottom Profile Bar */}
        <div className="p-3 border-t border-white/5 bg-[#07090e]">
          <div
            className={`flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/5 ${
              isSidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <AdminUserAvatar
              name={currentAdmin.name}
              avatarUrl={currentAdmin.avatar}
              size="sm"
              showOnline
            />
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {currentAdmin.name}
                </p>
                <p className="text-[10px] text-zinc-400 truncate">
                  {currentAdmin.roleTitle}
                </p>
              </div>
            )}
            {!isSidebarCollapsed && (
              <button
                onClick={() => {
                  window.history.pushState(null, '', '/');
                  window.location.href = '/';
                }}
                title="Logout / Exit Admin"
                className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
